# which http code responses should result in a retry?
HTTP_RETRY_CODES = [
    # 403,   # forbidden; used for non-available pages - do not retry
    408,    # request timeoue
    409,    # conflict; not clear whether retry will help or not, but worth a go
    420,    # enhance your calm; twitter rate limit code
    429,    # too many requests; general rate limit code
    444,    # no response; nginx specific, not clear if this actuall would go to the client
    502,    # bad gateway; retry to see if the gateway can re-establish connection
    503,    # service unavailable; retry to see if it comes back
    504     # gateway timeout; retry to see if it responds next time
]


