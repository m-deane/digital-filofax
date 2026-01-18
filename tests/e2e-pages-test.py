"""
End-to-end test for all Filofax app pages.
Tests that pages load and display correct content from the tRPC API.
"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "http://localhost:3333"

def test_all_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        results = []

        # First, sign in with dev credentials
        print("Signing in with dev credentials...")
        page.goto(f"{BASE_URL}/auth/login")
        page.wait_for_load_state('networkidle')

        # Try to find and fill in the dev login form
        email_input = page.locator("input[type='email'], input[name='email']").first
        if email_input.count() > 0:
            email_input.fill("dev@localhost")
            # Look for sign in button
            sign_in_btn = page.locator("button:has-text('Sign')").first
            if sign_in_btn.count() > 0:
                sign_in_btn.click()
                page.wait_for_load_state('networkidle')
                time.sleep(2)

        print(f"After sign in, URL: {page.url}")

        # Test Dashboard
        print("Testing Dashboard...")
        page.goto(f"{BASE_URL}/dashboard")
        page.wait_for_load_state('networkidle')
        has_dashboard_title = page.locator("text=Dashboard").count() > 0
        results.append(("Dashboard", has_dashboard_title))
        print(f"  Dashboard: {'PASS' if has_dashboard_title else 'FAIL'}")

        # Test Tasks page
        print("Testing Tasks page...")
        page.goto(f"{BASE_URL}/dashboard/tasks")
        page.wait_for_load_state('networkidle')
        has_tasks_title = page.locator("text=Tasks").first.count() > 0
        has_filter_button = page.locator("button:has-text('Filter')").count() > 0
        has_category_button = page.locator("button:has-text('Category')").count() > 0
        results.append(("Tasks Page", has_tasks_title))
        results.append(("Tasks Filter Button", has_filter_button))
        results.append(("Tasks Category Button", has_category_button))
        print(f"  Tasks Page: {'PASS' if has_tasks_title else 'FAIL'}")
        print(f"  Filter Button: {'PASS' if has_filter_button else 'FAIL'}")
        print(f"  Category Button: {'PASS' if has_category_button else 'FAIL'}")

        # Test Habits page
        print("Testing Habits page...")
        page.goto(f"{BASE_URL}/dashboard/habits")
        page.wait_for_load_state('networkidle')
        has_habits_title = page.locator("text=Habits").first.count() > 0
        results.append(("Habits Page", has_habits_title))
        print(f"  Habits Page: {'PASS' if has_habits_title else 'FAIL'}")

        # Test Ideas page
        print("Testing Ideas page...")
        page.goto(f"{BASE_URL}/dashboard/ideas")
        page.wait_for_load_state('networkidle')
        has_ideas_title = page.locator("text=Ideas").first.count() > 0
        results.append(("Ideas Page", has_ideas_title))
        print(f"  Ideas Page: {'PASS' if has_ideas_title else 'FAIL'}")

        # Test Memos page
        print("Testing Memos page...")
        page.goto(f"{BASE_URL}/dashboard/memos")
        page.wait_for_load_state('networkidle')
        has_memos_title = page.locator("text=Memos").first.count() > 0
        results.append(("Memos Page", has_memos_title))
        print(f"  Memos Page: {'PASS' if has_memos_title else 'FAIL'}")

        # Test Weekly Tasks page
        print("Testing Weekly Tasks page...")
        page.goto(f"{BASE_URL}/dashboard/weekly")
        page.wait_for_load_state('networkidle')
        has_weekly_title = page.locator("text=Weekly Tasks").count() > 0
        results.append(("Weekly Tasks Page", has_weekly_title))
        print(f"  Weekly Tasks Page: {'PASS' if has_weekly_title else 'FAIL'}")

        # Test Monthly Tasks page
        print("Testing Monthly Tasks page...")
        page.goto(f"{BASE_URL}/dashboard/monthly")
        page.wait_for_load_state('networkidle')
        has_monthly_title = page.locator("text=Monthly Tasks").count() > 0
        results.append(("Monthly Tasks Page", has_monthly_title))
        print(f"  Monthly Tasks Page: {'PASS' if has_monthly_title else 'FAIL'}")

        # Test Weekly Planner page
        print("Testing Weekly Planner page...")
        page.goto(f"{BASE_URL}/dashboard/planner/weekly")
        page.wait_for_load_state('networkidle')
        has_weekly_planner = page.locator("text=Weekly Planner").count() > 0
        results.append(("Weekly Planner Page", has_weekly_planner))
        print(f"  Weekly Planner Page: {'PASS' if has_weekly_planner else 'FAIL'}")

        # Test Monthly Planner page
        print("Testing Monthly Planner page...")
        page.goto(f"{BASE_URL}/dashboard/planner/monthly")
        page.wait_for_load_state('networkidle')
        page.screenshot(path="/tmp/monthly-planner-test.png")
        has_monthly_planner = page.locator("text=Monthly Planner").count() > 0
        body_text = page.locator("body").inner_text()
        h1_text = page.locator("h1").first.inner_text() if page.locator("h1").count() > 0 else "No H1"
        print(f"  H1 text: {h1_text}")
        print(f"  Body contains 'Monthly Planner': {'Monthly Planner' in body_text}")
        results.append(("Monthly Planner Page", has_monthly_planner))
        print(f"  Monthly Planner Page: {'PASS' if has_monthly_planner else 'FAIL'}")

        # Summary
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        passed = sum(1 for _, r in results if r)
        total = len(results)
        print(f"Passed: {passed}/{total}")
        for name, result in results:
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"  {status}: {name}")

        browser.close()

        return passed == total

if __name__ == "__main__":
    success = test_all_pages()
    exit(0 if success else 1)
