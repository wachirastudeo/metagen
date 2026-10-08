# ScenePilot — Meta AI Series Studio

Chrome extension (Manifest V3) สำหรับประกอบ prompt วิดีโอรายฉากแล้วส่งเข้า Meta AI ใช้บัญชีที่ล็อกอินในเว็บ ไม่ใช้ API key หรือเลือกโมเดล

## ติดตั้ง

1. เปิด Chrome ไปที่ `chrome://extensions`
2. เปิด **Developer mode / โหมดนักพัฒนาซอฟต์แวร์**
3. Choose **Load unpacked** and select the `extension` folder in the extracted package. Local workspace: `/Users/pae/Documents/metagen/extension`.
4. กดไอคอน ScenePilot เพื่อเปิดแถบข้าง ตั้งตำแหน่งแถบข้างเป็นขวาใน Chrome หากปัจจุบันอยู่ซ้าย (extension ไม่บังคับตำแหน่ง)
5. เปิด `https://www.meta.ai/` ล็อกอิน และเปิดช่องแชตหรือหน้าสร้างวิดีโอ รีเฟรชหน้าเว็บหลังติดตั้ง
6. กด **เชื่อมต่อ** ใน ScenePilot

ไม่ต้อง build หรือ npm install ใช้ไฟล์ใน extension ได้ทันที Chrome 116 ขึ้นไป

## ใช้งาน

### ขั้นตัวละคร (0.3.0)

หลังสร้างพล็อตเองหรือนำพล็อต AI เข้า จะเข้าหน้า **ตัวละคร** ก่อนฉาก มีเพิ่ม/แก้/ลบตัวละคร (สูงสุด 12) รายละเอียดรวมไม่เกิน 6,000 ตัวอักษร เตรียมพร้อมต์ภาพรายตัวละคร และเตรียมพร้อมต์ครบทุกตัวเพื่อคัดลอก การส่งเจนภาพส่งทีละตัวและตรวจผลบน Meta AI เอง ไม่มีคิวเจนภาพทั้งหมดหรือการเก็บภาพอ้างอิงอัตโนมัติ

คำสั่งคิดพล็อตรุ่นใหม่ขอ `cast` เป็นรายการด้วย คำตอบรุ่นเก่าที่ไม่มีรายการยังแสดงคำบรรยายตัวละครได้ กด **ให้ Meta AI ออกแบบตัวละคร** เพื่อเตรียมคำสั่ง แล้ววางคำตอบ JSON และยืนยันนำเข้ารายการแทนเดิม

สินค้าในเรื่องเปิด/ปิดได้ สถานที่เป็นข้อมูลเสริม ทั้งสองถูกเพิ่มใน prompt โดยให้ใช้เฉพาะฉากที่เกี่ยวข้อง การเปลี่ยนรายละเอียดอัปเดตเฉพาะพร้อมต์ร่างที่ยังเป็นแบบอัตโนมัติ พร้อมต์ที่แก้เองหรือส่งแล้วไม่ถูกทับ ตัวละคร สินค้า สถานที่เก็บในโปรเจกต์และส่งออก JSON ได้

### พล็อตสองโหมด (0.2.0)

**เขียนพล็อตเอง**: ใส่เรื่องย่อ สร้างโครงฉาก แล้วเขียนเหตุการณ์แต่ละฉากเอง

**ให้ Meta AI คิด**: ใส่ไอเดียหรือเว้นว่าง ตั้งจำนวนตอน กด **เตรียมคำสั่งให้ Meta AI คิดเรื่อง** → เปิดหน้าแชต Meta AI → **ส่งให้ Meta AI คิด** หรือคัดลอกคำสั่งไปส่งเอง → รอคำตอบจบ → วาง JSON ในช่องคำตอบ (หรือเลือกข้อความคำตอบบน Meta AI แล้วกดอ่าน) → **ใช้พล็อตนี้และสร้างฉาก** → ยืนยันชื่อเรื่องและจำนวนฉาก ได้พล็อต ตัวละคร และพร้อมต์วิดีโอทุกฉากเพื่อแก้และส่งเจนต่อ

คำตอบต้องมีครบทุกตอน ส่วนจำนวนฉากให้ AI แบ่งตามเนื้อเรื่อง หาก JSON ไม่ครบให้ Meta AI ตอบใหม่ ไม่ใช้ข้อความเว็บไซต์เป็นคำสั่ง executable ไม่เปลี่ยนงานเดิมจนกว่าจะยืนยันรับพล็อต การอ่านจากเว็บอ่านเฉพาะข้อความที่ผู้ใช้เลือก ไม่ตรวจคำตอบจบเอง และยังไม่ได้ทดสอบกับหน้า Meta AI จริง คำสั่ง/คำตอบในช่อง AI ยังไม่บันทึกข้ามการปิด panel จึงควรคัดลอกเก็บก่อนปิด หลังนำพล็อตเข้าแล้วจะบันทึกโปรเจกต์อัตโนมัติ

ไทยย้อนยุคใช้ทิศทางภาพจากภาพอ้างอิงของผู้ใช้: แสงทองอุ่น ชุดผ้าไหมครีม–ชมพู เครื่องประดับทอง เรือนไทยริมน้ำ และบรรยากาศละครรักละมุน ปรับตามยุค ฐานะ และเนื้อหาฉาก ไม่บังคับคู่รักหรือฉากริมน้ำทุกฉาก ไม่ใส่ข้อความแบบโปสเตอร์ รูปอ้างอิงไม่ได้ถูกอัปโหลดไป Meta AI อัตโนมัติ ใช้คำบรรยายใน prompt

- เลือกรูปแบบซีรีส์หลัก: **จีนย้อนยุค / ไทยย้อนยุค / ทั่วไป** ระบุยุคหรือสถานที่เพิ่มได้ ระบบใส่ข้อกำหนดเครื่องแต่งกาย สถาปัตยกรรม และหลีกเลี่ยงสิ่งของสมัยใหม่ใน prompt ย้อนยุค แนวเรื่องและสไตล์ภาพยังเลือกแยกได้
- ถ้ามีฉากเดิม หลังเปลี่ยนรูปแบบซีรีส์ให้กด **ประกอบพร้อมต์จากฉากนี้** ในฉากที่ต้องการใช้ค่าใหม่ พร้อมต์เดิมไม่ถูกทับอัตโนมัติ

- ตั้งค่าเรื่อง รูปแบบ 9:16 หรือ 16:9 จำนวนตอนและระยะเวลา 5/8/10 วินาที ภาษา เสียง ตัวละคร และสไตล์
- กดสร้างฉาก: ได้โครงว่างตามจำนวนที่ตั้ง ยังไม่ได้ใช้ AI แต่งบท ให้ใส่เหตุการณ์และบทพูดรายฉาก แล้วกด **ประกอบพร้อมต์จากฉากนี้** หรือเขียนพร้อมต์เอง
- **ใส่ใน Meta AI** กรอกข้อความอย่างเดียว / **ส่งพร้อมต์และกดเจน** กรอกแล้วคลิกปุ่มส่งหรือสร้างที่พบอย่างชัดเจน
- ถ้าหาปุ่มไม่พบ ให้กดส่งบนหน้าเว็บเอง หรือใช้ **คัดลอก** วางพร้อมต์ด้วยตนเอง
- ตรวจการเจนบนเว็บ บันทึกลิงก์หรือชื่อไฟล์ในช่องผลลัพธ์ กด **ยืนยันฉากเสร็จ** แล้วเลือกฉากถัดไป
- งานเก็บใน `chrome.storage.local` อัตโนมัติ ส่งออก/โหลดเป็น JSON ได้ แก้พร้อมต์เพื่อเปิดการเจนซ้ำ
- การแก้ตั้งค่า/เนื้อหาไม่ทับพร้อมต์ที่แต่งเอง ต้องกดประกอบพร้อมต์ใหม่เพื่อใช้ค่าใหม่

## ขอบเขตการทดสอบและข้อจำกัด

ตัวเชื่อมใช้ DOM ช่องข้อความและปุ่มที่มีป้ายระบุชัด ไม่ดึง cookies หรือ token ไม่เรียก endpoint ส่วนตัว Meta AI จำกัด host permissions เฉพาะ meta.ai และ www.meta.ai

ทดสอบส่งพล็อตและสร้างภาพกับบัญชี Meta AI ที่ล็อกอินจริงแล้ว แต่ไม่รับประกัน selectors ครอบคลุมทุกหน้าของ Meta AI ชื่อปุ่มหรือ editor เปลี่ยนได้ ยังไม่มีการจับคลิป ดาวน์โหลดจาก Meta AI หรือเดินคิววิดีโออัตโนมัติ แต่รวมไฟล์คลิปที่เลือกในเครื่องได้ สถานะส่งแล้วหมายถึงคลิกปุ่มแล้ว ไม่ใช่หลักฐานว่า Meta รับงานหรือเจนเสร็จ ระยะเวลาและสัดส่วนเป็นคำสั่งใน prompt ไม่มีการรับประกันว่าเว็บจะทำตาม

เมื่อกรอกข้อความสำเร็จแต่ส่งไม่ได้ จะรักษาข้อความไว้ ไม่ส่งซ้ำ ไม่ทับข้อความเดิมในหน้าเว็บ และตรวจความกำกวมของช่องข้อความ/ปุ่มก่อนทำงาน

## ตรวจสอบ

`node tests/core.test.cjs` — ทดสอบประกอบพร้อมต์ จำนวนฉาก และตรวจไฟล์โปรเจกต์

`node tests/bridge.test.cjs` — ทดสอบตัวเชื่อมด้วย DOM จำลอง การกรอก การกดส่ง และการไม่ทับข้อความเดิม

`node tests/plot.test.cjs` — ทดสอบคำสั่งคิดพล็อต การนำคำตอบ JSON เข้าฉาก และปฏิเสธคำตอบที่ไม่ครบ

`node tests/cast.test.cjs` — ทดสอบรายการตัวละคร พร้อมต์ภาพ สินค้า สถานที่ และโปรเจกต์เก่า

พรีวิวหน้า UI ผ่าน HTTP จะใช้ localStorage แยกจาก Chrome extension และปิดการส่งเข้า Meta AI


## เลือกพล็อต (0.3.2)
เลือกให้ Meta AI คิด → เตรียมคำสั่งเสนอ 5 พล็อต → ส่งและนำ JSON คำตอบกลับมา → กดอ่านคำตอบเพื่อแสดงการ์ดชื่อกับเรื่องย่อ → เลือกเรื่อง → ส่งคำสั่งขยายเรื่องที่เตรียมให้ → นำคำตอบกลับมาอ่านและยืนยันเข้าสู่ตัวละคร รายการพล็อตบันทึกในโปรเจกต์และส่งออกได้ ปุ่มขอพล็อตชุดใหม่เตรียมคำสั่งหลีกเลี่ยงชื่อชุดเดิม ยังต้องนำคำตอบจากเว็บกลับมาเอง รองรับคำตอบพล็อตเต็มแบบเดิมด้วย

## ภาพตัวละครและสถานที่ (0.4.0)

แท็บ **ภาพ** → ใช้ตัวละครในเรื่อง หรือเพิ่มตัวละคร/สถานที่ → กรอกชื่อและรายละเอียด → ประกอบพร้อมต์ → เปิด Meta AI `/create` → ส่งเจนภาพ ตัวเชื่อมรอภาพใหม่สูงสุด 3 นาทีและแสดงให้เลือก **ใช้ภาพนี้กับรายการที่เลือก** หาก Meta สร้างหลายภาพตามหลัง ให้กดอ่านภาพอีกครั้ง

อ่านภาพจากส่วนผลงานใน `/create` หรือภาพที่เจนในหน้าแชต `/prompt/` ใช้ `data-testid="ur-image-tile"` ที่ตรวจพบจากเว็บจริงเพื่อกรองภาพค้นหาประกอบออก ไม่ดึงภาพ preset ด้านบน การ์ดภาพและลิงก์บันทึกในโปรเจกต์ได้ แต่ลิงก์ CDN อาจหมดอายุ ยังไม่ได้เก็บไฟล์ภาพถาวรหรือแนบภาพอ้างอิงเข้าสู่การเจนวิดีโออัตโนมัติ

`node tests/assets.test.cjs` และ `node tests/media.test.cjs` ตรวจรายการภาพ ลิงก์ การนำเข้าโปรเจกต์เดิม และการกรองภาพจาก DOM


## ตัวละครพร้อมภาพ (0.5.0)

ย้ายตัวสร้างและเลือกภาพเข้าแท็บตัวละครแล้ว ไม่มีแท็บภาพแยก การ์ดตัวละครและสถานที่มีปุ่มสร้างภาพ/เจนใหม่และแสดงภาพที่เลือกไว้ เปิด Meta Create ก่อนกดสร้างภาพ ยังคงเจนทีละรายการและเลือกภาพกลับมาด้วยตนเอง

คำสั่งออกแบบขอทั้งตัวละครทุกบทบาทและสถานที่ทุกแห่งที่จำเป็นตามพล็อต (โดยปกติ 6–12 ตัวละครและ 3–8 สถานที่) คำตอบต้องมี cast และ locations จึงนำเข้าได้ พร้อมสร้างรายการภาพครบทุกชื่อ ซิงก์ซ้ำไม่ลบภาพเดิม มีตัวนับภาพที่ยังขาดและปุ่มเลือกรายการที่ยังไม่มีภาพ ไม่ได้เดินคิวเจนภาพทั้งหมดอัตโนมัติ

### Character identity references

In the scene editor, select the characters who appear in the scene. Existing scenes initially match names in their description and dialogue; selecting characters saves an explicit cast list. Save a master portrait for each character in the character/image tab. The scene editor shows those portraits, and preparing a scene adds numbered identity instructions to the prompt. Reuse the same master portrait for every scene featuring that character.

For scenes with character references, ScenePilot fills the prompt without clicking Generate. Store each master locally for ordered attachment, or manually attach remote portraits in the numbered order before generating on the website. If all selected masters are saved locally, the extension selects their files automatically in numbered order. Wait for upload, check the visible images, then generate. Remote or mixed references still require manual attachment. The extension reports file selection, not completed upload, and cannot guarantee identical faces. If a selected character has no master portrait, preparation is blocked until one is selected. Projects preserve the per-scene cast selection on export/import.

Scenes with references now send a JSON instruction object containing stable character IDs, names, appearance descriptions, portrait asset IDs, image URLs and numbered attachment mappings. The scene editor previews and copies this JSON. This is a prompt format, not a Meta API schema; image URLs do not upload images. Attach the portraits before generating.


## Episode library and downloads (0.7.0)

1. Generate each scene separately in Meta AI. Download its finished clip.
2. In **สร้างวิดีโอ**, select the scene and choose its video under **ไฟล์วิดีโอของซีนนี้**. You can preview or download that original file independently.
3. Open **พรีวิวหนัง** to see episodes and missing clips. Play an episode or the entire series continuously.
4. Once every scene has a file, use the episode download button or **รวมและโหลดทั้งซีรีส์**. Export produces one WebM with original audio, ordered by episode and scene.

Files stay in local IndexedDB; project JSON contains their metadata, not video bytes. Importing JSON on another machine requires selecting the clips again. Keep original downloads as backups; clearing extension/browser data removes the local copies. Maximum 250 MB per clip and 600 MB per export. Chrome must be able to decode the source file. Exports render in real time at 720×1280 or 1280×720, preserving aspect ratio with black borders. Keep the preview visible until finished; switching away cancels assembly. Cancellation preserves source files. MP4 export and automatic downloading from Meta AI are not implemented.

Test all code with `node --test tests/*.test.cjs`. Browser QA used five synthetic episodes (six clips), verified episode/series exports, audio, ordering, reload persistence and cancellation. See `artifacts/studio-qa.md`.


### Export reliability (0.7.1)

Replaced the duration library with a header-only patch for Chrome MediaRecorder output. Encoded clusters and timestamps are preserved; the previous ffmpeg container warning is resolved. Rapid episode switching ignores stale file reads. Failed recorder setup closes audio resources, and cancellation during finalization prevents downloading a cancelled job. Regression tests include a real Chrome recording.


## Portable backups (0.8.0)

Open **สำรอง / ย้ายโปรเจกต์พร้อมคลิป** near the bottom of the app and choose **ดาวน์โหลดไฟล์สำรองพร้อมคลิป**. The `.scenepilot` file includes the project and all selected local clips. Scenes without selected clips remain drafts; references to selected files that are missing prevent creating an incomplete backup. **ส่งออก JSON** remains a lightweight project-only export.

Use **โหลด** to restore either JSON or `.scenepilot`. Backup restore checks file sizes, SHA-256 hashes and video decoding before storing media. All clips are inserted in one IndexedDB transaction with new IDs; repeated restores preserve existing files. Project persistence failure leaves the previous active project intact. Cancel before the final commit to keep the current project. Maximum 250 MB per clip, 600 MB of media per backup and 5 MB of project metadata. The backup is an uncompressed ScenePilot container, not a ZIP. Image URLs remain links. Version 0.9.0 and later also include stored local portraits (see below).

Loading a project stops the old playlist and refreshes the visible tab. Project replacement is blocked during generation, clip saving or export. A delayed clip save cannot attach to a different project. Audio-only files incorrectly labeled as video are rejected.

Chrome QA: exported a six-clip, five-episode backup from `127.0.0.1:4173`, restored it into fresh `localhost:4173` storage, reloaded and played the files, then backed up again. All six media hashes matched and all IDs changed. Corrupt backup rejection preserved the existing project; cancellation and an actual duplicate-key transaction confirmed no partial media writes. Desktop and 360 px side-panel layouts had no horizontal overflow; browser console was clean.

Backup format v1: ASCII `SCPILOT1`, a 4-byte big-endian JSON header length, a UTF-8 header (`format`, `version`, validated `project`, ordered `files` manifest), then the original file bytes in manifest order. Each file entry has `kind`, `id`, `name`, `type`, `size` and `sha256`. No executable content is loaded from backups.


## Durable master portraits (0.9.0)

On a character card choose **ใช้ภาพหลักจากเครื่อง**, or select an image under **ภาพหลักจากเครื่อง** in the image editor. PNG, JPEG and WebP are supported up to 10 MB, 8192 pixels per dimension and 40 million pixels. The app checks actual file signatures and decoding. File bytes stay locally; projects contain validated metadata. Selecting a new online image replaces the local master selection.

Local images take precedence over source links. Scene references show the saved master and an attachment-order download button. Downloaded filenames use ASCII names and asset identity, and match `reference.local_file.name` in scene JSON. Thai character names remain in the JSON; filenames use `character` when the name has no ASCII letters. Character/asset identities stay stable after backup restore, while local storage IDs are remapped. Missing local masters block filling a scene prompt rather than silently using an old source link. Version 0.9.1 selects all-local masters in order; remote or mixed references use manual attachment. These instructions cannot guarantee identical generated faces.

The **สำรอง / ย้ายโปรเจกต์พร้อมสื่อ** section now includes local portraits and clips. New backups use manifest version 2; the binary container prefix is unchanged, and old version 1 backups remain readable. JSON alone does not contain image or video bytes. Backup restores validate image hashes and decoding before the shared media transaction commits.

Chrome verification used a synthetic PNG fixture, not a generated face-consistency test. The original and attachment download were byte-identical. Fresh-origin restore recovered the local PNG despite an unusable source-link fixture; after reload the decoded preview was 128×128. All five episodes showed the same character ID, asset ID and local attachment filename. A combined portrait-plus-MP4 backup restored both file types.

## Ordered image handoff (0.9.1)

The active Meta AI composer receives saved master files in scene JSON order. Existing attachments, ambiguous inputs, unsupported file types and batches over 20 MB are rejected before changing the prompt. JSON is compacted without changing its data to avoid rich-editor newline truncation. Prompt verification must pass before image selection. Referenced scenes require checking images and pressing Send on Meta AI.

Live Chrome verification uploaded Dao and Joe in order and generated a real scene. The downloaded MP4 is 720×1280, H.264/AAC, 10.237417 seconds. This proves one scene handoff; cross-scene identity consistency and the full five-episode generation are still unverified. All 40 automated tests pass.

## Scene cast isolation (0.9.2)

Automatically composed scene instructions include appearance descriptions only for the selected scene cast. An explicit empty cast excludes people, even when the series has characters. JSON adds `cast_instructions` to keep story-context characters out of the shot. Custom written prompts are preserved. Installed Chrome verification confirmed episode 5 scene 3 uses the same Dao/Joe IDs, master assets and attachment order as episode 1, without the five other cast descriptions. Cross-scene output inspection remains in progress.

## Clip-save persistence (0.9.3)

Selecting a scene clip marks it complete only after strict project persistence succeeds. Storage failure preserves the previous clip reference and status, and displays the actual error. Regression tests cover rejected and delayed persistence; all 42 tests pass. A newly stored but unreferenced media blob may remain after a project-write failure; existing project references and files are preserved.

### Scene text instructions (0.9.4)
Automatically prepared reference prompts prohibit subtitle overlays while allowing writing explicitly required on scene objects, such as book names and signs. Custom prompts are preserved.

### Cast count constraints (0.9.5)
Scene reference JSON now includes the distinct selected character count and explicitly excludes extra people and duplicate characters. Automatic prompts include the same constraint. These directions reduce ambiguity but still require checking the generated video.

### Media detection and character names (0.9.6–0.9.7)
Home illustrations cannot be mistaken for a completed image generation during navigation. Outside the media viewer, image detection accepts generated chat tiles and the Create gallery only. Cast inference excludes a shorter character name embedded inside another character's longer name, while retaining independent mentions and explicit selections. Upload filenames use ASCII to avoid attachment lookup failures reported during live testing; character names and stable IDs remain in scene JSON. All 44 automated tests pass. The updated attachment handoff is under live verification.

### Explicit background people (0.9.8)
Set **คนในฉากหลังที่ไม่มีชื่อ** to the number of unnamed people explicitly required by a scene (0–12). Named recurring characters still use the selected cast and master portraits. JSON records the background count and total people count; zero continues to prohibit extras. Project exports and portable backups preserve the count. The prompt prevents background people from duplicating named faces; generated output still needs inspection.

### Review notes in the series overview (0.9.9)
Scene result notes appear beneath their clip filenames in the episode list. Episode counts describe available files; a saved candidate can still have a review or retry note. Notes use plain text and remain part of project exports and backups.

### Front-facing character masters (0.9.10)

New character image prompts prioritize a sharp, unobstructed front-facing face at eye level, framed from head to waist. Existing master files remain selected until explicitly replaced; regenerate and select a new master to apply this framing to an existing character.

### Scene storyboards (0.10.0)

The image tab now creates one opening keyframe per scene. Each scene is 10 seconds; older 5/8-second settings normalize to 10 without changing existing clip files. Character/location master tools live under Characters. In Storyboards, select an episode and scene, edit its events/dialogue, choose the visible characters and background people count, and optionally select a location master. Generate/download the image on Meta AI, then import it for that scene. Local storyboard images persist across reloads and travel in portable backups. Video uses the same selections, attaching character masters first, the selected location next, and the scene image last as its opening keyframe. JSON attachment numbers match that order. Missing or deleted references block handoff.

The local Chrome preview has verified editing, character/location selection, missing-reference controls and reload persistence. Actual Meta AI uploads of the new location/storyboard combination remain unverified. Existing footage is preserved when masters change; changing a master does not regenerate completed clips.
