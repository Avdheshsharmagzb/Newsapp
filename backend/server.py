from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------- Object Storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "jagran-cms"
storage_key = None

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------- Models ----------------
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str = "#DC2626"
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class CategoryCreate(BaseModel):
    name: str
    color: str = "#DC2626"
    order: int = 0


class Author(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    designation: str = "संवाददाता"
    email: str = ""
    bio: str = ""
    created_at: str = Field(default_factory=now_iso)


class AuthorCreate(BaseModel):
    name: str
    designation: str = "संवाददाता"
    email: str = ""
    bio: str = ""


class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str = ""
    body: str = ""
    category: str = ""
    author: str = ""
    image_url: str = ""
    target: str = "both"  # website | newspaper | both
    status: str = "draft"  # draft | published
    newspaper_page: Optional[int] = None  # 1-8
    column_span: int = 1  # 1-3
    is_lead: bool = False
    views: int = 0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class ArticleCreate(BaseModel):
    title: str
    subtitle: str = ""
    body: str = ""
    category: str = ""
    author: str = ""
    image_url: str = ""
    target: str = "both"
    status: str = "draft"
    newspaper_page: Optional[int] = None
    column_span: int = 1
    is_lead: bool = False


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    image_url: Optional[str] = None
    target: Optional[str] = None
    status: Optional[str] = None
    newspaper_page: Optional[int] = None
    column_span: Optional[int] = None
    is_lead: Optional[bool] = None


class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    article_id: str = ""
    article_title: str = ""
    author_name: str
    content: str
    status: str = "pending"  # pending | approved | spam
    created_at: str = Field(default_factory=now_iso)


class CommentCreate(BaseModel):
    article_id: str = ""
    article_title: str = ""
    author_name: str
    content: str


# ---------------- Categories ----------------
@api_router.get("/categories", response_model=List[Category])
async def list_categories():
    docs = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(1000)
    return docs


@api_router.post("/categories", response_model=Category)
async def create_category(payload: CategoryCreate):
    obj = Category(**payload.model_dump())
    await db.categories.insert_one(obj.model_dump())
    return obj


@api_router.put("/categories/{cid}", response_model=Category)
async def update_category(cid: str, payload: CategoryCreate):
    await db.categories.update_one({"id": cid}, {"$set": payload.model_dump()})
    doc = await db.categories.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "श्रेणी नहीं मिली")
    return doc


@api_router.delete("/categories/{cid}")
async def delete_category(cid: str):
    await db.categories.delete_one({"id": cid})
    return {"ok": True}


# ---------------- Authors ----------------
@api_router.get("/authors", response_model=List[Author])
async def list_authors():
    docs = await db.authors.find({}, {"_id": 0}).to_list(1000)
    return docs


@api_router.post("/authors", response_model=Author)
async def create_author(payload: AuthorCreate):
    obj = Author(**payload.model_dump())
    await db.authors.insert_one(obj.model_dump())
    return obj


@api_router.put("/authors/{aid}", response_model=Author)
async def update_author(aid: str, payload: AuthorCreate):
    await db.authors.update_one({"id": aid}, {"$set": payload.model_dump()})
    doc = await db.authors.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "लेखक नहीं मिला")
    return doc


@api_router.delete("/authors/{aid}")
async def delete_author(aid: str):
    await db.authors.delete_one({"id": aid})
    return {"ok": True}


# ---------------- Articles ----------------
@api_router.get("/articles", response_model=List[Article])
async def list_articles(target: Optional[str] = None, status: Optional[str] = None,
                        newspaper_page: Optional[int] = None, category: Optional[str] = None):
    q = {}
    if status:
        q["status"] = status
    if category:
        q["category"] = category
    if newspaper_page is not None:
        q["newspaper_page"] = newspaper_page
    if target:
        q["target"] = {"$in": [target, "both"]}
    docs = await db.articles.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.get("/articles/{aid}", response_model=Article)
async def get_article(aid: str):
    doc = await db.articles.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "समाचार नहीं मिला")
    await db.articles.update_one({"id": aid}, {"$inc": {"views": 1}})
    return doc


@api_router.post("/articles", response_model=Article)
async def create_article(payload: ArticleCreate):
    obj = Article(**payload.model_dump())
    await db.articles.insert_one(obj.model_dump())
    return obj


@api_router.put("/articles/{aid}", response_model=Article)
async def update_article(aid: str, payload: ArticleUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.articles.update_one({"id": aid}, {"$set": updates})
    doc = await db.articles.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "समाचार नहीं मिला")
    return doc


@api_router.delete("/articles/{aid}")
async def delete_article(aid: str):
    await db.articles.delete_one({"id": aid})
    return {"ok": True}


# ---------------- Newspaper ----------------
NEWSPAPER_PAGES = [
    {"page": 1, "title": "मुख्य समाचार", "subtitle": "Front Page"},
    {"page": 2, "title": "राष्ट्रीय एवं राज्य", "subtitle": "National & State"},
    {"page": 3, "title": "सिटी", "subtitle": "Local City News"},
    {"page": 4, "title": "विचार / संपादकीय", "subtitle": "Editorial & Opinion"},
    {"page": 5, "title": "कारोबार", "subtitle": "Business & Market"},
    {"page": 6, "title": "खेल", "subtitle": "Sports"},
    {"page": 7, "title": "मनोरंजन / लाइफस्टाइल", "subtitle": "Entertainment"},
    {"page": 8, "title": "विदेश / विशेष", "subtitle": "World News & Special"},
]


@api_router.get("/newspaper/pages")
async def newspaper_pages():
    return NEWSPAPER_PAGES


@api_router.get("/newspaper/{page}", response_model=List[Article])
async def newspaper_page_articles(page: int):
    docs = await db.articles.find(
        {"newspaper_page": page, "target": {"$in": ["newspaper", "both"]}},
        {"_id": 0},
    ).to_list(1000)
    docs.sort(key=lambda d: (not d.get("is_lead", False), d.get("created_at", "")))
    return docs


class PlacementUpdate(BaseModel):
    newspaper_page: Optional[int] = None
    column_span: Optional[int] = None
    is_lead: Optional[bool] = None


@api_router.put("/newspaper/place/{aid}", response_model=Article)
async def place_article(aid: str, payload: PlacementUpdate):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    updates["updated_at"] = now_iso()
    await db.articles.update_one({"id": aid}, {"$set": updates})
    doc = await db.articles.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "समाचार नहीं मिला")
    return doc


# ---------------- Comments ----------------
@api_router.get("/comments", response_model=List[Comment])
async def list_comments(status: Optional[str] = None):
    q = {"status": status} if status else {}
    docs = await db.comments.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.post("/comments", response_model=Comment)
async def create_comment(payload: CommentCreate):
    obj = Comment(**payload.model_dump())
    await db.comments.insert_one(obj.model_dump())
    return obj


@api_router.put("/comments/{cid}/status", response_model=Comment)
async def set_comment_status(cid: str, status: str = Query(...)):
    await db.comments.update_one({"id": cid}, {"$set": {"status": status}})
    doc = await db.comments.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "टिप्पणी नहीं मिली")
    return doc


@api_router.delete("/comments/{cid}")
async def delete_comment(cid: str):
    await db.comments.delete_one({"id": cid})
    return {"ok": True}


# ---------------- Media ----------------
@api_router.get("/media")
async def list_media():
    docs = await db.media.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.post("/media/upload")
async def upload_media(file: UploadFile = File(...), caption: str = Query("")):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, content_type)
    rec = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "caption": caption,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "url": f"/api/media/file/{result['path']}",
        "is_deleted": False,
        "created_at": now_iso(),
    }
    await db.media.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api_router.get("/media/file/{path:path}")
async def serve_media(path: str):
    record = await db.media.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "फ़ाइल नहीं मिली")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))


@api_router.delete("/media/{mid}")
async def delete_media(mid: str):
    await db.media.update_one({"id": mid}, {"$set": {"is_deleted": True}})
    return {"ok": True}


# ---------------- Analytics ----------------
@api_router.get("/analytics/overview")
async def analytics_overview():
    total = await db.articles.count_documents({})
    published = await db.articles.count_documents({"status": "published"})
    drafts = await db.articles.count_documents({"status": "draft"})
    web = await db.articles.count_documents({"target": {"$in": ["website", "both"]}})
    paper = await db.articles.count_documents({"target": {"$in": ["newspaper", "both"]}})
    pending_comments = await db.comments.count_documents({"status": "pending"})
    authors = await db.authors.count_documents({})
    categories = await db.categories.count_documents({})

    page_status = []
    for p in NEWSPAPER_PAGES:
        cnt = await db.articles.count_documents({"newspaper_page": p["page"], "target": {"$in": ["newspaper", "both"]}})
        page_status.append({"page": p["page"], "title": p["title"], "count": cnt})

    by_cat = []
    cats = await db.categories.find({}, {"_id": 0}).to_list(1000)
    for c in cats:
        cnt = await db.articles.count_documents({"category": c["name"]})
        by_cat.append({"name": c["name"], "color": c.get("color", "#DC2626"), "count": cnt})

    top = await db.articles.find({}, {"_id": 0}).sort("views", -1).to_list(5)

    total_views_cur = db.articles.aggregate([{"$group": {"_id": None, "v": {"$sum": "$views"}}}])
    tv = await total_views_cur.to_list(1)
    total_views = tv[0]["v"] if tv else 0

    return {
        "total": total, "published": published, "drafts": drafts,
        "web": web, "paper": paper, "pending_comments": pending_comments,
        "authors": authors, "categories": categories, "total_views": total_views,
        "page_status": page_status, "by_category": by_cat, "top_articles": top,
    }


@api_router.get("/")
async def root():
    return {"message": "दैनिक जागरण CMS API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Seed ----------------
async def seed_data():
    if await db.articles.count_documents({}) > 0:
        return
    logger.info("Seeding sample data...")

    cats = [
        {"name": "राष्ट्रीय", "color": "#DC2626", "order": 1},
        {"name": "राज्य", "color": "#D97706", "order": 2},
        {"name": "सिटी", "color": "#16A34A", "order": 3},
        {"name": "संपादकीय", "color": "#7C3AED", "order": 4},
        {"name": "कारोबार", "color": "#2563EB", "order": 5},
        {"name": "खेल", "color": "#0891B2", "order": 6},
        {"name": "मनोरंजन", "color": "#DB2777", "order": 7},
        {"name": "विदेश", "color": "#059669", "order": 8},
    ]
    for c in cats:
        await db.categories.insert_one(Category(**c).model_dump())

    authors = [
        {"name": "राजेश कुमार", "designation": "ब्यूरो प्रमुख", "email": "rajesh@jagran.in"},
        {"name": "सुनीता शर्मा", "designation": "विशेष संवाददाता", "email": "sunita@jagran.in"},
        {"name": "अमित वर्मा", "designation": "वरिष्ठ संवाददाता", "email": "amit@jagran.in"},
        {"name": "प्रिया सिंह", "designation": "संवाददाता", "email": "priya@jagran.in"},
    ]
    author_objs = []
    for a in authors:
        obj = Author(**a)
        author_objs.append(obj)
        await db.authors.insert_one(obj.model_dump())

    img = "https://images.unsplash.com/photo-1574957747984-82c7fa4eef46?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBuZXdzJTIwcmVwb3J0ZXJ8ZW58MHx8fHwxNzkwOTY3NTA5fDA&ixlib=rb-4.1.0&q=85"
    img2 = "https://images.unsplash.com/photo-1529243856184-fd5465488984?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBuZXdzfGVufDB8fHx8MTc5MDk2NzUwOXww&ixlib=rb-4.1.0&q=85"

    def auth(i):
        return author_objs[i % len(author_objs)].name

    samples = [
        # page 1 - front
        {"title": "देश में विकास की नई इबारत, बजट में ऐतिहासिक घोषणाएँ", "subtitle": "आधारभूत ढांचे और रोजगार पर सरकार का विशेष जोर, युवाओं के लिए नई योजनाएँ", "category": "राष्ट्रीय", "page": 1, "lead": True, "span": 3, "img": img},
        {"title": "मानसून समय पर, किसानों के चेहरे खिले", "subtitle": "मौसम विभाग ने जारी किया पूर्वानुमान", "category": "राष्ट्रीय", "page": 1, "span": 2, "img": img2},
        {"title": "शहर में नई मेट्रो लाइन का उद्घाटन", "subtitle": "यातायात होगा सुगम", "category": "सिटी", "page": 1, "span": 1},
        {"title": "स्वास्थ्य सेवाओं में बड़ा सुधार", "subtitle": "नए अस्पतालों की सौगात", "category": "राष्ट्रीय", "page": 1, "span": 1},
        # page 2 - national/state
        {"title": "राज्य सरकार ने पेश की नई शिक्षा नीति", "subtitle": "डिजिटल कक्षाओं पर जोर", "category": "राज्य", "page": 2, "lead": True, "span": 2, "img": img},
        {"title": "विधानसभा सत्र में गूंजा रोजगार का मुद्दा", "subtitle": "विपक्ष ने उठाए सवाल", "category": "राज्य", "page": 2, "span": 1},
        {"title": "बाढ़ प्रभावित क्षेत्रों में राहत कार्य तेज", "subtitle": "प्रशासन मुस्तैद", "category": "राष्ट्रीय", "page": 2, "span": 1},
        # page 3 - city
        {"title": "नगर निगम का सफाई अभियान शुरू", "subtitle": "वार्डों में चलेगा विशेष अभियान", "category": "सिटी", "page": 3, "lead": True, "span": 2, "img": img2},
        {"title": "स्थानीय बाजार में त्योहारी रौनक", "subtitle": "दुकानों पर उमड़ी भीड़", "category": "सिटी", "page": 3, "span": 1},
        {"title": "शहर के पार्कों का होगा कायाकल्प", "subtitle": "हरियाली बढ़ाने की पहल", "category": "सिटी", "page": 3, "span": 1},
        # page 4 - editorial
        {"title": "संपादकीय: लोकतंत्र में संवाद की भूमिका", "subtitle": "विचार-विमर्श ही प्रगति का मार्ग", "category": "संपादकीय", "page": 4, "lead": True, "span": 2},
        {"title": "पर्यावरण संरक्षण: समय की माँग", "subtitle": "हर नागरिक की जिम्मेदारी", "category": "संपादकीय", "page": 4, "span": 1},
        # page 5 - business
        {"title": "शेयर बाजार ने छुआ नया शिखर", "subtitle": "सेंसेक्स और निफ्टी में उछाल", "category": "कारोबार", "page": 5, "lead": True, "span": 2, "img": img},
        {"title": "स्टार्टअप्स को मिलेगा नया प्रोत्साहन", "subtitle": "सरकार की नई पहल", "category": "कारोबार", "page": 5, "span": 1},
        {"title": "सोने-चांदी के दामों में हलचल", "subtitle": "निवेशकों की नजर बाजार पर", "category": "कारोबार", "page": 5, "span": 1},
        # page 6 - sports
        {"title": "भारत ने जीता रोमांचक मुकाबला", "subtitle": "अंतिम ओवर में पलटी बाजी", "category": "खेल", "page": 6, "lead": True, "span": 3, "img": img2},
        {"title": "युवा खिलाड़ियों का शानदार प्रदर्शन", "subtitle": "राष्ट्रीय स्तर पर चमके सितारे", "category": "खेल", "page": 6, "span": 1},
        # page 7 - entertainment
        {"title": "नई फिल्म ने बॉक्स ऑफिस पर मचाई धूम", "subtitle": "दर्शकों की भारी भीड़", "category": "मनोरंजन", "page": 7, "lead": True, "span": 2, "img": img},
        {"title": "संगीत समारोह में उमड़े प्रशंसक", "subtitle": "सुरों की शाम रही यादगार", "category": "मनोरंजन", "page": 7, "span": 1},
        # page 8 - world
        {"title": "वैश्विक शिखर सम्मेलन में अहम फैसले", "subtitle": "जलवायु पर बनी सहमति", "category": "विदेश", "page": 8, "lead": True, "span": 2, "img": img2},
        {"title": "अंतरराष्ट्रीय व्यापार में नए अवसर", "subtitle": "कई देशों से हुए समझौते", "category": "विदेश", "page": 8, "span": 1},
    ]

    for i, s in enumerate(samples):
        art = Article(
            title=s["title"], subtitle=s.get("subtitle", ""),
            body="यह एक नमूना समाचार लेख है। " * 20,
            category=s["category"], author=auth(i), image_url=s.get("img", ""),
            target="both", status="published", newspaper_page=s["page"],
            column_span=s.get("span", 1), is_lead=s.get("lead", False),
            views=(i * 37 + 120) % 900,
        )
        await db.articles.insert_one(art.model_dump())

    comments = [
        {"author_name": "मोहन लाल", "content": "बहुत अच्छी खबर है, धन्यवाद!", "article_title": samples[0]["title"]},
        {"author_name": "गीता देवी", "content": "जानकारी के लिए शुक्रिया।", "article_title": samples[1]["title"], "status": "approved"},
        {"author_name": "spam user", "content": "Buy cheap products now!!!", "article_title": samples[2]["title"]},
    ]
    for c in comments:
        obj = Comment(author_name=c["author_name"], content=c["content"],
                      article_title=c.get("article_title", ""), status=c.get("status", "pending"))
        await db.comments.insert_one(obj.model_dump())

    logger.info("Seeding complete.")


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
