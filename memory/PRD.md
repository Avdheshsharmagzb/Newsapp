# PRD — दैनिक जागरण कॉमन CMS डैशबोर्ड

## Original Problem Statement
वेबसाइट और न्यूजपेपर के लिए एक ही कॉमन डैशबोर्ड बनाओ जो एक ही डेटाबेस से जुड़े हों।

## User Choices
- Article/News CMS + categories, authors, media, comments, analytics (all modules)
- केवल डैशबोर्ड (पब्लिक साइट बाद में); डैशबोर्ड के अंदर ही 8-पेज अखबार व्यूअर जो दैनिक जागरण डिज़ाइन में हो, एडमिन समाचार सेट करे
- कोई लॉगिन नहीं
- हिंदी इंटरफ़ेस + इमेज अपलोड

## Architecture
- Backend: FastAPI + MongoDB (motor). All routes under /api. Auto-seed on startup.
- Frontend: React 19 + React Router + Tailwind + shadcn + recharts + sonner.
- Image upload: Emergent object storage (EMERGENT_LLM_KEY), served via /api/media/file/{path}.
- Single DB powers both "website" and "newspaper" via article `target` field (website/newspaper/both).

## Core Requirements (static)
- एक ही डेटाबेस से वेबसाइट + अखबार दोनों के समाचार
- 8-पेज अखबार, दैनिक जागरण शैली, एडमिन-नियंत्रित लेआउट
- हिंदी UI, इमेज अपलोड, बिना लॉगिन

## Implemented (2026-06)
- मुख्य डैशबोर्ड: stats, 8-पेज लेआउट स्थिति, श्रेणी चार्ट, टॉप समाचार
- समाचार प्रबंधन (CRUD): target, status, newspaper page, column span, lead, image
- 8-पेज अखबार व्यूअर: masthead, dateline, ear panels, section headers, lead story + column grid, drop-cap, print; पृष्ठ 1-8 चयन; लेआउट संपादक drawer (जोड़ें/हटाएँ, lead, column span)
- श्रेणी प्रबंधन (रंग + क्रम), लेखक/संवाददाता प्रबंधन
- मीडिया लाइब्रेरी (Emergent object storage upload + soft delete)
- टिप्पणी समीक्षा (approve/spam/delete + tabs)
- एनालिटिक्स (pie + bar charts)
- Seed: 8 श्रेणियाँ, 4 लेखक, 21 समाचार (8 पृष्ठों पर), 3 टिप्पणियाँ
- Tested: backend 17/17, frontend core flows 100%

## Backlog / Remaining
- P1: Public-facing website render (abhi केवल डैशबोर्ड)
- P1: Authentication/roles (अभी open access)
- P2: PDF export of newspaper, rich-text editor for body, media caption edit
- P2: Response caching for media serving
