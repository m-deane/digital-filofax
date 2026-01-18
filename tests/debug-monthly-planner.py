"""Debug the Monthly Planner page"""
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3333"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to Monthly Planner...")
    page.goto(f"{BASE_URL}/dashboard/planner/monthly")
    page.wait_for_load_state('networkidle')

    # Take screenshot
    page.screenshot(path="/tmp/monthly-planner.png", full_page=True)
    print("Screenshot saved to /tmp/monthly-planner.png")

    # Get page title text
    h1_elements = page.locator("h1").all_text_contents()
    print(f"H1 elements: {h1_elements}")

    # Check for any error messages
    error_elements = page.locator(".text-destructive").all_text_contents()
    if error_elements:
        print(f"Error messages: {error_elements}")

    # Get all text on page
    body_text = page.locator("body").inner_text()
    print(f"Body contains 'Monthly Planner': {'Monthly Planner' in body_text}")
    print(f"First 500 chars of body:\n{body_text[:500]}")

    browser.close()
