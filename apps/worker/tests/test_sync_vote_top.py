from worker.jobs.sync_vote_top import _parse_online_players, _parse_vote_count, parse_vote_top_response


def test_parse_vote_top_response_handles_ranked_vote_lines():
    response = """
    &aTop Voters
    #1. Steve - 42 votes
    2) Alex: 31
    3 Builder_99 | 1,005 votes
    """

    assert parse_vote_top_response(response) == [
        {
            "position": 1,
            "player": "Builder_99",
            "score": 1005,
            "votes": 1005,
            "metadata": {"source": "rcon", "command": "/vote Top Monthly"},
        },
        {
            "position": 2,
            "player": "Steve",
            "score": 42,
            "votes": 42,
            "metadata": {"source": "rcon", "command": "/vote Top Monthly"},
        },
        {
            "position": 3,
            "player": "Alex",
            "score": 31,
            "votes": 31,
            "metadata": {"source": "rcon", "command": "/vote Top Monthly"},
        },
    ]


def test_parse_vote_top_response_skips_noise_and_duplicates():
    response = """
    No voting data header
    Steve - 10 votes
    Steve - 9 votes
    """

    assert parse_vote_top_response(response) == [
        {
            "position": 1,
            "player": "Steve",
            "score": 10,
            "votes": 10,
            "metadata": {"source": "rcon", "command": "/vote Top Monthly"},
        },
    ]


def test_parse_vote_top_response_handles_votingplugin_labeled_votes():
    response = """
    Top Voters Monthly - Page 1
    1. Steve Votes: 42
    2. Alex - Votes: 31
    """

    assert parse_vote_top_response(response) == [
        {
            "position": 1,
            "player": "Steve",
            "score": 42,
            "votes": 42,
            "metadata": {"source": "rcon", "command": "/vote Top Monthly"},
        },
        {
            "position": 2,
            "player": "Alex",
            "score": 31,
            "votes": 31,
            "metadata": {"source": "rcon", "command": "/vote Top Monthly"},
        },
    ]


def test_parse_online_players_handles_colored_list_response():
    response = "§6There are §c3§6 out of maximum §c100§6 players online.\n§6default§r: _Naseef_§f, prime9, shadow7sensei"

    assert _parse_online_players(response) == ["_Naseef_", "prime9", "shadow7sensei"]


def test_parse_vote_count_handles_placeholder_output():
    assert _parse_vote_count("§a1,234") == 1234
    assert _parse_vote_count("Not a valid placeholder") == 0
