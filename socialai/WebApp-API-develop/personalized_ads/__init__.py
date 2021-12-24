from personalized_ads.data_service import *

def clear():
  clear_exports()

def check():
  check_for_exports()

# NOTE: run hourly
if __name__ == '__main__':
    print("Starting Personalized Ads Checker/Cleaner")
    check()
    clear()