"""Check Monthly Planner page with network and console monitoring"""
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3333"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Collect console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))

    # Collect network errors
    network_errors = []
    page.on("requestfailed", lambda request: network_errors.append(f"{request.url}: {request.failure}"))

    print("Navigating directly to /dashboard/planner/monthly...")
    response = page.goto(f"{BASE_URL}/dashboard/planner/monthly", wait_until="networkidle")
    print(f"Response status: {response.status}")
    print(f"Final URL: {page.url}")

    if console_messages:
        print(f"\nConsole messages ({len(console_messages)}):")
        for msg in console_messages[:10]:
            print(f"  {msg}")

    if network_errors:
        print(f"\nNetwork errors ({len(network_errors)}):")
        for err in network_errors:
            print(f"  {err}")

    # Check for React error boundary
    error_text = page.locator("text=Error").all_text_contents()
    if error_text:
        print(f"\nError elements found: {error_text}")

    browser.close()
