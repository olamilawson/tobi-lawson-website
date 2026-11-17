"""The home page's Outlook reads: today's events and unread mail, shaped for the page."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from personal_agent.graph_mail import GraphMail


def _graph(handler) -> GraphMail:
    def route(request: httpx.Request) -> httpx.Response:
        if "login.microsoftonline.com" in str(request.url):
            return httpx.Response(200, json={"access_token": "t", "expires_in": 3600})
        return handler(request)

    return GraphMail("tenant", "client", "secret", "me@example.com", transport=httpx.MockTransport(route))


def test_events_between_drops_cancelled_and_reads_times_as_utc():
    seen = {}

    def handler(request):
        seen["url"] = str(request.url)
        return httpx.Response(200, json={"value": [
            {"id": "1", "subject": "Board", "start": {"dateTime": "2026-11-15T09:00:00.0000000"},
             "end": {"dateTime": "2026-11-15T10:00:00.0000000"}, "location": {"displayName": "Office"},
             "attendees": [{}, {}]},
            {"id": "2", "subject": "Gone", "isCancelled": True, "start": {"dateTime": "2026-11-15T11:00:00"},
             "end": {"dateTime": "2026-11-15T12:00:00"}},
        ]})

    day = datetime(2026, 11, 15, tzinfo=timezone.utc)
    events = _graph(handler).events_between(day, day.replace(hour=23))
    assert "calendarView" in seen["url"]
    assert events == [{"id": "1", "subject": "Board", "start": "2026-11-15T09:00:00+00:00",
                       "end": "2026-11-15T10:00:00+00:00", "all_day": False, "place": "Office", "attendees": 2}]


def test_unread_names_the_sender():
    def handler(request):
        assert "isRead eq false" in request.url.params["$filter"]
        return httpx.Response(200, json={"value": [
            {"id": "m", "subject": "Contract", "receivedDateTime": "2026-11-15T08:00:00Z",
             "from": {"emailAddress": {"name": "Ada", "address": "ada@example.com"}}, "bodyPreview": "Can you sign", "importance": "high"},
        ]})

    [m] = _graph(handler).unread(datetime(2026, 11, 15, tzinfo=timezone.utc))
    assert m["from"] == "Ada" and m["address"] == "ada@example.com" and m["important"] is True
