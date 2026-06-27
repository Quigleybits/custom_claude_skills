from pathlib import Path
import re
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
HANDOVER_DIR = REPO_ROOT / "skills" / "handover"


class HandoverSecurityTests(unittest.TestCase):
    def test_handover_has_no_executable_launchers(self) -> None:
        self.assertFalse((HANDOVER_DIR / "handover_send.py").exists())
        self.assertFalse((HANDOVER_DIR / "handover_continue.py").exists())

    def test_handover_skill_does_not_enable_automatic_tasks(self) -> None:
        content = (HANDOVER_DIR / "SKILL.md").read_text(encoding="utf-8")
        self.assertNotIn(".vscode/tasks.json", content)
        self.assertNotIn("Allow Automatic Tasks", content)
        self.assertNotIn("CREATE_NEW_CONSOLE", content)

    def test_public_handover_docs_do_not_expose_local_identifiers(self) -> None:
        content = "\n".join(
            (HANDOVER_DIR / name).read_text(encoding="utf-8")
            for name in ("SKILL.md", "handover.md", "handover.html")
        )
        self.assertIsNone(re.search(r"C:[/\\]Users[/\\]aidan", content, re.IGNORECASE))
        self.assertIsNone(re.search(r"\bwf_[A-Za-z0-9_-]+", content))


if __name__ == "__main__":
    unittest.main()
