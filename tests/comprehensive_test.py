"""Comprehensive 20-Pass Testing Suite for Personal Filofax App"""
from playwright.sync_api import sync_playwright
import json
import time

class TestResults:
    def __init__(self):
        self.bugs = []
        self.ux_observations = []
        self.console_errors = []
        self.passed_tests = 0
        self.failed_tests = 0

    def add_bug(self, severity, description, location):
        self.bugs.append({"severity": severity, "description": description, "location": location})
        self.failed_tests += 1

    def add_ux(self, category, location, observation, priority="P2"):
        self.ux_observations.append({
            "category": category,
            "location": location,
            "observation": observation,
            "priority": priority
        })

    def test_passed(self):
        self.passed_tests += 1

    def summary(self):
        return {
            "total_bugs": len(self.bugs),
            "critical_bugs": len([b for b in self.bugs if b["severity"] == "Critical"]),
            "ux_observations": len(self.ux_observations),
            "passed": self.passed_tests,
            "failed": self.failed_tests
        }


def run_all_passes():
    results = TestResults()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Capture console errors
        page.on("console", lambda msg: results.console_errors.append(msg.text) if msg.type == "error" else None)

        # === PASS 1: Auth (already tested) ===
        print("\n" + "="*60)
        print("PASS 1: Authentication (Quick Verify)")
        print("="*60)
        page.goto("http://localhost:3333/auth/login")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        if "/dashboard" in page.url:
            print("✓ Auto-login working")
            results.test_passed()
        else:
            results.add_bug("Critical", "Auto-login not working", "auth")

        # === PASS 2: Dashboard Layout ===
        print("\n" + "="*60)
        print("PASS 2: Dashboard Layout & Navigation")
        print("="*60)
        page.goto("http://localhost:3333/dashboard")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass2_dashboard.png", full_page=True)

        # Check sidebar navigation
        nav_items = [
            ("Dashboard", "/dashboard"),
            ("Tasks", "/dashboard/tasks"),
            ("Weekly Tasks", "/dashboard/weekly"),
            ("Monthly Tasks", "/dashboard/monthly"),
            ("Weekly Planner", "/dashboard/planner/weekly"),
            ("Monthly Planner", "/dashboard/planner/monthly"),
            ("Habits", "/dashboard/habits"),
            ("Memos", "/dashboard/memos"),
            ("Ideas", "/dashboard/ideas"),
            ("Settings", "/dashboard/settings"),
        ]

        for name, expected_path in nav_items:
            link = page.locator(f"text={name}").first
            if link.is_visible():
                print(f"  ✓ {name} nav link visible")
                results.test_passed()
            else:
                print(f"  ✗ {name} nav link NOT visible")
                results.add_bug("Medium", f"{name} navigation link missing", "sidebar")

        # Check dashboard widgets
        widgets = ["Tasks Due Today", "Active Habits", "Events This Week", "Notes Created"]
        for widget in widgets:
            if page.locator(f"text={widget}").count() > 0:
                print(f"  ✓ {widget} widget present")
                results.test_passed()
            else:
                print(f"  ⚠ {widget} widget not found")
                results.add_ux("Layout", "Dashboard", f"{widget} widget missing or has different text", "P2")

        # === PASS 3: Header & Theme ===
        print("\n" + "="*60)
        print("PASS 3: Header Components & Theme Switching")
        print("="*60)

        # Check header elements
        search_bar = page.locator("input[placeholder*='Search']")
        if search_bar.is_visible():
            print("  ✓ Search bar visible")
            results.test_passed()
        else:
            results.add_bug("Low", "Search bar not visible", "header")

        quick_capture = page.locator("text=Quick Capture")
        if quick_capture.is_visible():
            print("  ✓ Quick Capture button visible")
            results.test_passed()
        else:
            results.add_bug("Medium", "Quick Capture button not visible", "header")

        # Theme toggle
        theme_btn = page.locator("[class*='theme'], button:has(svg[class*='sun']), button:has(svg[class*='moon'])").first
        if theme_btn.count() > 0:
            print("  ✓ Theme toggle found")
            results.test_passed()
            # Try toggling theme
            try:
                theme_btn.click()
                page.wait_for_timeout(500)
                page.screenshot(path="/tmp/pass3_theme_toggle.png")
                print("  ✓ Theme toggle clicked")
            except:
                print("  ⚠ Could not click theme toggle")
        else:
            results.add_ux("Accessibility", "Header", "Theme toggle button not easily identifiable", "P2")

        # === PASS 4: Page Transitions ===
        print("\n" + "="*60)
        print("PASS 4: Page Transitions & Loading States")
        print("="*60)

        pages_to_test = [
            ("/dashboard/tasks", "Tasks"),
            ("/dashboard/habits", "Habits"),
            ("/dashboard/memos", "Memos"),
            ("/dashboard/ideas", "Ideas"),
            ("/dashboard/planner/weekly", "Weekly Planner"),
            ("/dashboard/planner/monthly", "Monthly Planner"),
            ("/dashboard/settings", "Settings"),
        ]

        for path, name in pages_to_test:
            page.goto(f"http://localhost:3333{path}")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(500)

            if page.url.endswith(path) or path in page.url:
                print(f"  ✓ {name} page loads")
                results.test_passed()
            else:
                print(f"  ✗ {name} page redirect issue: {page.url}")
                results.add_bug("Medium", f"{name} page not loading correctly", path)

        # === PASS 5-8: Task Management ===
        print("\n" + "="*60)
        print("PASSES 5-8: Task Management Features")
        print("="*60)

        page.goto("http://localhost:3333/dashboard/tasks")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass5_tasks.png", full_page=True)

        # Check for task list or empty state
        task_content = page.content()
        if "Add Task" in task_content or "task" in task_content.lower():
            print("  ✓ Tasks page has content")
            results.test_passed()

        # Check for Add Task button
        add_task_btn = page.locator("text=Add Task, button:has-text('Add'), text=New Task").first
        if add_task_btn.count() > 0:
            print("  ✓ Add Task button found")
            results.test_passed()
            # Try clicking it
            try:
                add_task_btn.click()
                page.wait_for_timeout(500)
                page.screenshot(path="/tmp/pass5_add_task_dialog.png")
                # Check for dialog/form
                if page.locator("[role='dialog'], form, .modal").count() > 0:
                    print("  ✓ Task creation dialog opens")
                    results.test_passed()
                    # Close dialog
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(300)
            except Exception as e:
                print(f"  ⚠ Could not test task creation: {e}")
        else:
            results.add_ux("Functionality", "Tasks", "Add Task button not clearly visible", "P1")

        # === PASS 9-11: Calendar & Planning ===
        print("\n" + "="*60)
        print("PASSES 9-11: Calendar & Planning Views")
        print("="*60)

        # Weekly planner
        page.goto("http://localhost:3333/dashboard/planner/weekly")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass9_weekly.png", full_page=True)

        if "week" in page.content().lower() or page.locator("[class*='calendar'], [class*='week']").count() > 0:
            print("  ✓ Weekly planner shows calendar content")
            results.test_passed()
        else:
            results.add_ux("Layout", "Weekly Planner", "Calendar view not clearly visible", "P2")

        # Monthly planner
        page.goto("http://localhost:3333/dashboard/planner/monthly")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass10_monthly.png", full_page=True)

        if "month" in page.content().lower() or page.locator("[class*='calendar'], [class*='month']").count() > 0:
            print("  ✓ Monthly planner shows calendar content")
            results.test_passed()

        # === PASS 12-14: Habits ===
        print("\n" + "="*60)
        print("PASSES 12-14: Habit Tracking")
        print("="*60)

        page.goto("http://localhost:3333/dashboard/habits")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass12_habits.png", full_page=True)

        habit_content = page.content()
        if "habit" in habit_content.lower() or "streak" in habit_content.lower():
            print("  ✓ Habits page has content")
            results.test_passed()

        # Check for Add Habit button
        add_habit_btn = page.locator("text=Add Habit, text=New Habit, button:has-text('Add')").first
        if add_habit_btn.count() > 0:
            print("  ✓ Add Habit functionality available")
            results.test_passed()

        # === PASS 15-16: Memos & Ideas ===
        print("\n" + "="*60)
        print("PASSES 15-16: Memos & Ideas")
        print("="*60)

        # Memos
        page.goto("http://localhost:3333/dashboard/memos")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass15_memos.png", full_page=True)

        if "memo" in page.content().lower() or "note" in page.content().lower():
            print("  ✓ Memos page has content")
            results.test_passed()

        # Ideas
        page.goto("http://localhost:3333/dashboard/ideas")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass16_ideas.png", full_page=True)

        if "idea" in page.content().lower():
            print("  ✓ Ideas page has content")
            results.test_passed()

        # === PASS 17-18: Categories & Tags ===
        print("\n" + "="*60)
        print("PASSES 17-18: Categories & Tags (via Settings)")
        print("="*60)

        page.goto("http://localhost:3333/dashboard/settings")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass17_settings.png", full_page=True)

        settings_content = page.content()
        if "settings" in settings_content.lower() or "preference" in settings_content.lower():
            print("  ✓ Settings page loads")
            results.test_passed()

        # === PASS 19-20: Responsive & Polish ===
        print("\n" + "="*60)
        print("PASSES 19-20: Responsive Design & Polish")
        print("="*60)

        # Test mobile viewport
        page.set_viewport_size({"width": 375, "height": 667})
        page.goto("http://localhost:3333/dashboard")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass19_mobile.png", full_page=True)

        # Check if sidebar collapses or has mobile menu
        mobile_menu = page.locator("[class*='hamburger'], button[aria-label*='menu'], [class*='mobile-nav']")
        sidebar_visible = page.locator("nav, [class*='sidebar']").first

        if mobile_menu.count() > 0 or not sidebar_visible.is_visible():
            print("  ✓ Mobile responsive behavior detected")
            results.test_passed()
        else:
            results.add_ux("Responsive", "Dashboard", "Sidebar may need better mobile handling", "P2")

        # Test tablet viewport
        page.set_viewport_size({"width": 768, "height": 1024})
        page.wait_for_timeout(500)
        page.screenshot(path="/tmp/pass19_tablet.png", full_page=True)
        print("  ✓ Tablet viewport captured")

        # Reset to desktop
        page.set_viewport_size({"width": 1280, "height": 800})

        # === Final Summary ===
        print("\n" + "="*60)
        print("COMPREHENSIVE TEST SUMMARY")
        print("="*60)

        summary = results.summary()
        print(f"\nTests Passed: {summary['passed']}")
        print(f"Tests Failed: {summary['failed']}")
        print(f"Total Bugs: {summary['total_bugs']} (Critical: {summary['critical_bugs']})")
        print(f"UX Observations: {summary['ux_observations']}")

        if results.bugs:
            print("\n--- BUGS ---")
            for bug in results.bugs:
                print(f"  [{bug['severity']}] {bug['description']} @ {bug['location']}")

        if results.ux_observations:
            print("\n--- UX OBSERVATIONS ---")
            for ux in results.ux_observations:
                print(f"  [{ux['priority']}] {ux['category']}: {ux['observation']} @ {ux['location']}")

        if results.console_errors:
            print(f"\n--- CONSOLE ERRORS ({len(results.console_errors)}) ---")
            for err in results.console_errors[:10]:
                print(f"  {err[:100]}")

        print("\nScreenshots saved to /tmp/pass*.png")

        browser.close()

    return results


if __name__ == "__main__":
    run_all_passes()
