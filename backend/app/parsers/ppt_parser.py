import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from backend.app.parsers.base import BaseParser, ParsedResult
from backend.app.parsers.pptx_parser import PPTXParser

class PPTParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> ParsedResult:
        if not content:
            raise ValueError("The uploaded PowerPoint file is empty (0 bytes).")
            
        # Check if LibreOffice headless is available
        soffice_bin = shutil.which("soffice") or shutil.which("libreoffice")
        
        if not soffice_bin:
            raise ValueError(
                "Legacy .ppt binary files require LibreOffice for server-side processing, which is not available in this environment. "
                "Please open the file in Microsoft PowerPoint, Google Slides, or Keynote, save/export it as a modern .pptx file, and upload again."
            )
            
        with tempfile.TemporaryDirectory() as tmp_dir:
            ppt_path = os.path.join(tmp_dir, filename)
            with open(ppt_path, "wb") as f:
                f.write(content)
                
            # Convert PPT to PPTX via soffice
            cmd = [
                soffice_bin,
                "--headless",
                "--convert-to",
                "pptx",
                "--outdir",
                tmp_dir,
                ppt_path
            ]
            
            try:
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
                if proc.returncode != 0:
                    raise ValueError(f"LibreOffice conversion failed: {proc.stderr.decode('utf-8', errors='ignore')}")
            except subprocess.TimeoutExpired:
                raise ValueError("Conversion of legacy .ppt timed out after 30 seconds.")
                
            base_name = Path(filename).stem
            converted_pptx = os.path.join(tmp_dir, f"{base_name}.pptx")
            
            if not os.path.exists(converted_pptx):
                raise ValueError("Failed to generate .pptx from .ppt. Please convert the presentation manually to .pptx.")
                
            with open(converted_pptx, "rb") as f:
                pptx_bytes = f.read()
                
            parsed = PPTXParser().parse(pptx_bytes, f"{base_name}.pptx")
            parsed.filename = filename
            parsed.warnings.append("Converted from legacy .ppt to .pptx format.")
            return parsed
