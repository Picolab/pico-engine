# tic tac toe ruleset

The [tic-tac-toe ruleset](https://github.com/Picolab/tic-tac-toe-didcommv2) is an implementation of a DIDComm protocol called [Tic Tac Toe Protocol 1.0](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0003-protocols/tictactoe/README.md).

## Implementing a protocol

## Functions

### getGames()

### generate_tictactoe_move(id, thid, sender_order, me, moves, comment)

### generate_tictactoe_outcome(thid, seqnum, winner, comment)

### generate_problem_report(id, message)

### send_move(id, move, me, comment)

### start_game(did, move, me, comment)

### receive_move(message, did)

### send_problem_report(id, problem)

## Rules

### initialize

### start_game

### send_move

### receive_move

### send_outcome

### receive_outcome

### delete_game

### send_problem_report

### receive_problem_report

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2408808465) (last edited there 2023-06-01).</small>
