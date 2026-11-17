import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from pypdf import PdfWriter
from pptx import Presentation
from pptx.util import Inches
from docx import Document as DocxDocument

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

def create_fixtures():
    # 1. Text PDF
    pdf_path = os.path.join(FIXTURES_DIR, "lecture_sample.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("Lecture 4: Introduction to Neural Networks", styles['Heading1']),
        Spacer(1, 12),
        Paragraph("Deep Learning models are composed of layered artificial neurons that compute weighted sums of inputs passed through nonlinear activation functions like ReLU and Sigmoid.", styles['Normal']),
        Spacer(1, 10),
        Paragraph("Backpropagation calculates the gradient of the loss function with respect to each weight using the chain rule of calculus. Stochastic Gradient Descent iteratively adjusts parameters to minimize empirical risk.", styles['Normal']),
        Spacer(1, 10),
        Paragraph("Key challenges include vanishing gradients in deep networks, overfitting on training partitions, and hyperparameter selection for learning rate decay.", styles['Normal'])
    ]
    doc.build(elements)
    print("Created lecture_sample.pdf")

    # 2. Scanned / Empty Text Layer PDF
    scanned_path = os.path.join(FIXTURES_DIR, "scanned_empty_text.pdf")
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    with open(scanned_path, "wb") as f:
        writer.write(f)
    print("Created scanned_empty_text.pdf")

    # 3. Password-Protected PDF
    protected_path = os.path.join(FIXTURES_DIR, "password_protected.pdf")
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    writer.encrypt("secret123")
    with open(protected_path, "wb") as f:
        writer.write(f)
    print("Created password_protected.pdf")

    # 4. PPTX with Slide Text, Speaker Notes, and Tables
    pptx_path = os.path.join(FIXTURES_DIR, "lecture_presentation.pptx")
    prs = Presentation()
    
    # Slide 1: Title
    slide_layout = prs.slide_layouts[0]
    slide1 = prs.slides.add_slide(slide_layout)
    slide1.shapes.title.text = "Distributed Systems: Consensus Protocols"
    slide1.placeholders[1].text = "Ayush Kumar\nDepartment of Computer Science"
    notes_slide1 = slide1.notes_slide
    notes_slide1.notes_text_frame.text = "Welcome everyone. Today we examine Paxos and Raft distributed consensus models."

    # Slide 2: Bullets & Notes
    bullet_layout = prs.slide_layouts[1]
    slide2 = prs.slides.add_slide(bullet_layout)
    slide2.shapes.title.text = "The Raft Consensus Algorithm"
    tf = slide2.placeholders[1].text_frame
    tf.text = "Raft decomposes consensus into leader election, log replication, and safety."
    p1 = tf.add_paragraph()
    p1.text = "Nodes operate in three states: Follower, Candidate, or Leader."
    p2 = tf.add_paragraph()
    p2.text = "Heartbeats prevent election timeouts across follower quorum."
    notes_slide2 = slide2.notes_slide
    notes_slide2.notes_text_frame.text = "Crucial exam topic: be prepared to trace leader election when split-votes occur."

    # Slide 3: Table
    table_layout = prs.slide_layouts[5]  # Title only
    slide3 = prs.slides.add_slide(table_layout)
    slide3.shapes.title.text = "Protocol Comparison"
    rows, cols = 3, 2
    left, top, width, height = Inches(1), Inches(2), Inches(6), Inches(2)
    table_shape = slide3.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table
    table.cell(0, 0).text = "Metric"
    table.cell(0, 1).text = "Raft"
    table.cell(1, 0).text = "Understandability"
    table.cell(1, 1).text = "Designed for pedagogical clarity"
    table.cell(2, 0).text = "Leader Role"
    table.cell(2, 1).text = "Strong leader with unified log dispatch"

    prs.save(pptx_path)
    print("Created lecture_presentation.pptx")

    # 5. Word Document (.docx)
    docx_path = os.path.join(FIXTURES_DIR, "lecture_notes.docx")
    docx_doc = DocxDocument()
    docx_doc.add_heading("Database Systems: ACID Properties", level=0)
    docx_doc.add_heading("1. Atomicity & Consistency", level=1)
    docx_doc.add_paragraph("Atomicity guarantees all operations within a transaction complete successfully, or all changes roll back entirely. Consistency ensures the database transitions between valid relational schemas.")
    docx_doc.add_heading("2. Isolation & Durability", level=1)
    docx_doc.add_paragraph("Isolation prevents concurrent transactions from interfering. Serializability is the strictest isolation level. Durability guarantees committed writes persist across crashes via Write-Ahead Logging (WAL).")
    docx_doc.save(docx_path)
    print("Created lecture_notes.docx")

    # 6. Plain Text File (.txt)
    txt_path = os.path.join(FIXTURES_DIR, "operating_systems.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("""# Lecture 7: Virtual Memory Management

## Paging and Page Faults
Virtual memory provides an abstraction of uniform memory space per process.
The Memory Management Unit (MMU) translates virtual addresses to physical frame addresses using page tables.
When a process requests an address not present in physical RAM, the CPU hardware raises a page fault trap.

## Page Replacement Algorithms
The operating system must select a victim page to evict:
- FIFO (First In First Out): simple but exhibits Belady's Anomaly.
- LRU (Least Recently Used): approximates optimal replacement using stack distance or reference bits.
- Clock Algorithm: circular buffer approximation of LRU with low overhead.
""")
    print("Created operating_systems.txt")

    # 7. Empty File (0 bytes)
    empty_path = os.path.join(FIXTURES_DIR, "empty_file.txt")
    with open(empty_path, "wb") as f:
        pass
    print("Created empty_file.txt")

    # 8. Corrupt File
    corrupt_path = os.path.join(FIXTURES_DIR, "corrupt_document.pdf")
    with open(corrupt_path, "wb") as f:
        f.write(b"%PDF-1.4\n%MalformedGarbageDataNotInAnyValidPdfStructure1234567890\x00\xff")
    print("Created corrupt_document.pdf")

if __name__ == "__main__":
    create_fixtures()
