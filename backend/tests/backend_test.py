"""Backend API tests for Dainik Jagran CMS."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://unified-dashboard-94.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


# ---------------- Health ----------------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "CMS" in r.json().get("message", "")


# ---------------- Categories ----------------
class TestCategories:
    def test_list(self, session):
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 8

    def test_crud(self, session):
        payload = {"name": "TEST_श्रेणी", "color": "#111111", "order": 99}
        r = session.post(f"{API}/categories", json=payload)
        assert r.status_code == 200
        cid = r.json()["id"]
        assert r.json()["name"] == payload["name"]

        r = session.put(f"{API}/categories/{cid}", json={"name": "TEST_updated", "color": "#222222", "order": 100})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_updated"

        r = session.delete(f"{API}/categories/{cid}")
        assert r.status_code == 200


# ---------------- Authors ----------------
class TestAuthors:
    def test_list(self, session):
        r = session.get(f"{API}/authors")
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_crud(self, session):
        r = session.post(f"{API}/authors", json={"name": "TEST_लेखक", "designation": "संवाददाता"})
        assert r.status_code == 200
        aid = r.json()["id"]

        r = session.put(f"{API}/authors/{aid}", json={"name": "TEST_updated_author", "designation": "विशेष"})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_updated_author"

        r = session.delete(f"{API}/authors/{aid}")
        assert r.status_code == 200


# ---------------- Articles ----------------
class TestArticles:
    def test_list_seeded(self, session):
        r = session.get(f"{API}/articles")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 21

    def test_filter_by_page(self, session):
        r = session.get(f"{API}/articles", params={"newspaper_page": 1})
        assert r.status_code == 200
        for a in r.json():
            assert a["newspaper_page"] == 1

    def test_crud(self, session):
        payload = {
            "title": "TEST_समाचार शीर्षक", "subtitle": "उप शीर्षक", "body": "शरीर पाठ",
            "category": "राष्ट्रीय", "author": "राजेश कुमार", "target": "both",
            "status": "draft", "newspaper_page": 2, "column_span": 2, "is_lead": False,
        }
        r = session.post(f"{API}/articles", json=payload)
        assert r.status_code == 200
        aid = r.json()["id"]
        assert r.json()["title"] == payload["title"]

        # GET to verify persistence (increments views)
        r = session.get(f"{API}/articles/{aid}")
        assert r.status_code == 200
        assert r.json()["title"] == payload["title"]

        # Update
        r = session.put(f"{API}/articles/{aid}", json={"status": "published", "title": "TEST_updated_title"})
        assert r.status_code == 200
        assert r.json()["status"] == "published"
        assert r.json()["title"] == "TEST_updated_title"

        # Delete
        r = session.delete(f"{API}/articles/{aid}")
        assert r.status_code == 200
        r = session.get(f"{API}/articles/{aid}")
        assert r.status_code == 404


# ---------------- Newspaper ----------------
class TestNewspaper:
    def test_pages(self, session):
        r = session.get(f"{API}/newspaper/pages")
        assert r.status_code == 200
        assert len(r.json()) == 8

    def test_page_1(self, session):
        r = session.get(f"{API}/newspaper/1")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        # Lead should be first
        assert data[0].get("is_lead") is True

    def test_place_article(self, session):
        # Create and move
        r = session.post(f"{API}/articles", json={"title": "TEST_placement", "target": "both", "status": "draft"})
        aid = r.json()["id"]
        r = session.put(f"{API}/newspaper/place/{aid}", json={"newspaper_page": 5, "column_span": 3, "is_lead": True})
        assert r.status_code == 200
        assert r.json()["newspaper_page"] == 5
        assert r.json()["column_span"] == 3
        assert r.json()["is_lead"] is True
        session.delete(f"{API}/articles/{aid}")


# ---------------- Comments ----------------
class TestComments:
    def test_list(self, session):
        r = session.get(f"{API}/comments")
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_filter(self, session):
        r = session.get(f"{API}/comments", params={"status": "pending"})
        assert r.status_code == 200
        for c in r.json():
            assert c["status"] == "pending"

    def test_moderate(self, session):
        r = session.post(f"{API}/comments", json={"author_name": "TEST_user", "content": "TEST comment"})
        assert r.status_code == 200
        cid = r.json()["id"]
        r = session.put(f"{API}/comments/{cid}/status", params={"status": "approved"})
        assert r.status_code == 200
        assert r.json()["status"] == "approved"
        r = session.delete(f"{API}/comments/{cid}")
        assert r.status_code == 200


# ---------------- Media ----------------
class TestMedia:
    def test_upload_and_serve(self, session):
        # 1x1 PNG
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
            "890000000d4944415478da63f8cfc0f01f0000030101007d2b2a1d0000000049454e44ae426082"
        )
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = session.post(f"{API}/media/upload", files=files, params={"caption": "TEST"})
        assert r.status_code == 200, r.text
        rec = r.json()
        assert "url" in rec
        assert rec["url"].startswith("/api/media/file/")

        # Serve
        r2 = session.get(f"{BASE_URL}{rec['url']}")
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

        # Delete
        r3 = session.delete(f"{API}/media/{rec['id']}")
        assert r3.status_code == 200

    def test_list(self, session):
        r = session.get(f"{API}/media")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_overview(self, session):
        r = session.get(f"{API}/analytics/overview")
        assert r.status_code == 200
        data = r.json()
        for k in ["total", "published", "drafts", "web", "paper", "page_status", "by_category", "top_articles"]:
            assert k in data
        assert len(data["page_status"]) == 8
        assert len(data["by_category"]) >= 8
