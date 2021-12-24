from notifications.data_service import *

# NOTE: run every 30 minutes
if __name__ == '__main__':
    print("Starting Notifications Checker")
    check_for_notifications()