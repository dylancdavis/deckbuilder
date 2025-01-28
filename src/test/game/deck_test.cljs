(ns test.game.deck-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.game.deck :refer [check-deck-validity]]))

(deftest check-deck-validity-test
  (is (= (check-deck-validity {:cards {} :rules-card {:deck-limits {:size [0,0]}}} {}) true) "Empty deck should be valid for [0,0]")
  (is (= (check-deck-validity {:cards {:a 3} :rules-card {:deck-limits {:size [4,8]}}} {}) false) "Deck below minimmum size shoulve be invalid")
  (is (= (check-deck-validity {:cards {:a 9} :rules-card {:deck-limits {:size [4,8]}}} {}) false) "Deck above maximum size should be invalid")
  (is (= (check-deck-validity {:cards {:a 4} :rules-card {:deck-limits {:size [4,8]}}} {}) true) "Deck with minimum size should be valid")
  (is (= (check-deck-validity {:cards {:a 6} :rules-card {:deck-limits {:size [4,8]}}} {}) true) "Deck between range should be valid")
  (is (= (check-deck-validity {:cards {:a 8} :rules-card {:deck-limits {:size [4,8]}}} {}) true) "Deck with maximum size should be valid"))
  
