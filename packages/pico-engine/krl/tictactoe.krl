ruleset tictactoe {
    meta {
        name "Tic-Tac-Toe"
        description
        <<
        A sample ruleset implementing the DidComm Tic-Tac-Toe protocol
        https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0003-protocols/tictactoe/README.md
        >>
        author "Josh Mann"

		shares getGames

        use module io.picolabs.wrangler alias wrangler
		use module io.picolabs.did-o alias didx
    }

    global {

		getGames = function() {
			ent:games
		}

		generate_tictactoe_move = function(id, thid, sender_order, me, moves, comment) {
			{
			  	"type": "did:sov:SLfEi9esrjzybysFxQZbfq;spec/tictactoe/1.0/move",
			  	"typ": "application/didcomm-plain+json",
			  	"id": id,
			  	"thid": thid,
			  	"body": {
					"~thread": {"thid": thid, "sender_order": sender_order},
					"me": me,
					"moves": moves,
					"comment": comment
			  	}
			}
		}
	  
		generate_tictactoe_outcome = function(thid, seqnum, winner, comment) {
			{
			  	"type": "did:sov:SLfEi9esrjzybysFxQZbfq;spec/tictactoe/1.0/outcome",
			  	"typ": "application/didcomm-plain+json",
			  	"thid": thid,
				"body": {
			  		"winner": winner,
			  		"comment": comment
				}
			}
		}

		generate_problem_report = function(id, message) {
			{
				"type": "https://didcomm.org/report-problem/1.0/problem-report",
				"typ": "application/didcomm-plain+json",
				"id": random:uuid(),
				"thid": id,
				"body": {
					"description": message
				}
			}
		}

		send_move = function(id, move, me, comment) {
			game = ent:games.defaultsTo({}){id}
			moves = game{"moves"}.append(move)
			a = game.set(["moves"], moves)
			message = generate_tictactoe_move(a{"id"}, a{"id"}, a{"order"}, me, a{"moves"}, comment)
			b = a.set(["order"], game{"order"} + 1)
			c = game{"state"} == "my_move" => b.set(["state"], "their_move") | "not-your-turn"
			// d = ent:games.set([id], c)
			s = c.typeof() == "Map" => didx:send(game{"did"}, message) | null
			c
		}

		start_game = function(did, move, me, comment) {
			game = {
				"id": random:uuid(),
				"moves": [move],
				"me": me,
				"order": 0,
				"state": "their_move",
				"did": did
			}
			message = generate_tictactoe_move(game{"id"}, null, null, me, game{"moves"}, comment)
			a = game.set(["order"], game{"order"} + 1)
			// d = ent:games.defaultsTo({}).put(game{"id"}, a)
			s = didx:send(game{"did"}, message)
			a
		}

		receive_move = function(message, did) {
			game = (ent:games.defaultsTo({}){message{"id"}} ||
				   ent:games.defaultsTo({}){message{"thid"}} || {
						"id": message{"id"},
						"moves": [],
						"me": message{"body"}{"me"} == "X" => "O" | "X",
						"order": 0,
						"state": "their_move",
						"did": did
				   }).klog("REceive move: ")
			a = game.set(["moves"], message{"body"}{"moves"}).klog("moves: ")
			b = game{"state"} == "their_move" => a.set(["state"], "my_move") | "not-your-turn"
			b
			// b = ent:games.defaultsTo({}).put(game{"id"}, a).klog("stored? ")
			// b
		}

		send_problem_report = function(id, problem) {
			report = generate_problem_report(id, problem)
			did = ent:games{id}{"did"}
			didx:send(did, report)
		}
    }

	rule initialize {
		select when wrangler ruleset_installed where event:attrs{"rids"} >< meta:rid
    	pre {
      		route0 = didx:addRoute("did:sov:SLfEi9esrjzybysFxQZbfq;spec/tictactoe/1.0/move", "tictactoe", "receive_move")
      		route1 = didx:addRoute("did:sov:SLfEi9esrjzybysFxQZbfq;spec/tictactoe/1.0/outcome", "tictactoe", "receive_outcome")
      		route2 = didx:addRoute("https://didcomm.org/report-problem/1.0/problem-report", "tictactoe", "receive_problem_report")
    	}
	}

	rule start_game {
		select when tictactoe start_game
		pre {
			did = event:attrs{"did"}
			me = event:attrs{"me"}
			move = event:attrs{"move"}
			comment = event:attrs{"comment"}
			game = start_game(did, move, me, comment)
		}
		always {
			ent:games := ent:games.defaultsTo({}).put(game{"id"}, game)
		}
	}

    rule send_move {
        select when tictactoe send_move
    	pre {
        	id = event:attrs{"id"}
			move = event:attrs{"move"}
			me = event:attrs{"me"}
			comment = event:attrs{"comment"}
			game = send_move(id, move, me, comment)
    	}
		if game.typeof() == "Map" then noop()
		fired {
			ent:games := ent:games.defaultsTo({}).put(game{"id"}, game)
		} else {
			// Not your turn!
		}
	}

	rule receive_move {
    	select when tictactoe receive_move
		pre {
			message = event:attrs{"message"}
			their_did = event:attrs{"metadata"}{"encrypted_from_kid"}.split("#")[0]
			game = receive_move(message, their_did)
		}
		if game.typeof() == "Map" then noop()
		fired {
			ent:games := ent:games.defaultsTo({}).put(game{"id"}, game)
		} else {
			raise tictactoe event "send_problem_report" attributes event:attrs.put("problem", game)
		}
	}

  	rule send_outcome {
    	select when tictactoe send_outcome
  	}

  	rule receive_outcome {
    	select when tictactoe receive_outcome
  	}

	rule delete_game {
		select when tictactoe delete_game
		pre {
			id = event:attrs{"id"}
		}
		always {
			ent:games := ent:games.defaultsTo({}).delete(id);
		}
	}

	rule send_problem_report {
		select when tictactoe send_problem_report
		pre {
			id = event:attrs{"message"}{"id"}
			problem = event:attrs{"problem"}
			a = send_problem_report(id, problem)
		}
	}
	rule receive_problem_report {
		select when tictactoe receive_problem_report

	}

}