import os
import time
import sys
import boto3
from threading import Thread
from funnel_messages import parse_message, MessageType
from response_parser.data_service import *
import sentry_sdk
from sentry_sdk import capture_exception
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

if os.getenv('SENTRY_DISABLED') is None:
    sentry_sdk.init(
        dsn="https://62ba2356b651461c8db067f56ad6ea08@sentry.io/2074044",
        integrations=[SqlalchemyIntegration()],
        environment=os.getenv('STAGE', 'dev')
    )

queue_url = os.getenv('QUEUE_URL')

sqs = boto3.resource('sqs')
q = sqs.Queue(queue_url)


class SqsPoller(Thread):
    def __init__(self):
        super().__init__()
        self.running = True

    def stop(self):
        self.running = False

    def run(self):
        while self.running:
            messages = q.receive_messages(MaxNumberOfMessages=10, VisibilityTimeout=120, WaitTimeSeconds=10,
                                          AttributeNames=["ApproximateReceiveCount"])
            messages_to_dispose = []
            for message in messages:
                try:
                    parsed, message_type = parse_message(message)
                    if message_type == MessageType.NEW_POST:
                        is_parsed = parse_for_response(parsed)
                        if is_parsed:
                            q.delete_messages(Entries=[{'Id': str(parsed['id']), 'ReceiptHandle': message.receipt_handle}])
                    else:
                        messages_to_dispose.append({'Id': parsed['id'], 'ReceiptHandle': message.receipt_handle})
                        q.delete_messages(Entries=[{'Id': str(parsed['id']), 'ReceiptHandle': message.receipt_handle}])
                except Exception as e:
                    print('An error occured as follows:')
                    print(e)
                    print(message)
                    print('')
                    capture_exception(e)

        print("Sqs Polling stopped")


def parse_for_response(message):
    has_config, resp_config, response_type = check_for_config(message)
    if has_config:
        print(resp_config)
        print(response_type)
        print(message)
        return save_response(resp_config, response_type, message)
    else:
        return True


def shutdown():
    print("stopping SQS poller")
    sqs_poller.stop()
    sqs_poller.join()
    print("SQS poller stopped")

    print("Everything stopped, exiting")
    sys.exit(0)


if __name__ == '__main__':
    print("Starting SQS poller")
    sqs_poller = SqsPoller()
    sqs_poller.start()

    # time.sleep(600)
    # shutdown()
