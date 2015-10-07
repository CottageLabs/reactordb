from octopus.core import app

default_max_pages = app.config.get("DEFAULT_MAX_PAGES")

PRISURL = app.config.get("PRISURL")

sections_available = app.config.get("SECTIONS_AVAILABLE")

sections_scraped = app.config.get("SECTIONS_SCRAPED")

reactor_details_data_dir = app.config.get("REACTOR_DETAILS_DATA_DIR")

page_details_id = app.config.get("PAGE_DETAILS_ID")

reactor_details_id = app.config.get("REACTOR_DETAILS_ID")

reactor_details_header = app.config.get("REACTOR_DETAILS_HEADER")

operating_history_data_dir = app.config.get("OPERATING_HISTORY_DATA_DIR")

operating_history_header = app.config.get("OPERATING_HISTORY_HEADER")

reactor_details_process_case = app.config.get("REACTOR_DETAILS_PROCESS_CASE")

# No reactor name and comment in operating history table
operating_history_data_columns = app.config.get("OPERATING_HISTORY_DATA_COLUMNS")

# Minimum success rate for page scraper
success_rate = app.config.get("SUCCESS_RATE")
