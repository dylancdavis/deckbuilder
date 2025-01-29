(ns deckbuilder.game.deck-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.game.deck :refer [deck-in-size-range?]]))

(deftest deck-in-size-range?-test
  (is (= (deck-in-size-range? {:cards {} :rules-card nil}) true) "Empty deck should be vacuously true when no rules card")
  (is (= (deck-in-size-range? {:cards {:a 3} :rules-card nil}) true) "Populated deck should be vacuously true when no rules card")
  (is (= (deck-in-size-range? {:cards {} :rules-card {:deck-limits {:size [0,0]}}}) true) "Empty deck should be valid for [0,0]")
  (is (= (deck-in-size-range? {:cards {:a 3} :rules-card {:deck-limits {:size [4,8]}}}) false) "Deck below minimmum size shoulve be invalid")
  (is (= (deck-in-size-range? {:cards {:a 9} :rules-card {:deck-limits {:size [4,8]}}}) false) "Deck above maximum size should be invalid")
  (is (= (deck-in-size-range? {:cards {:a 4} :rules-card {:deck-limits {:size [4,8]}}}) true) "Deck with minimum size should be valid")
  (is (= (deck-in-size-range? {:cards {:a 6} :rules-card {:deck-limits {:size [4,8]}}}) true) "Deck between range should be valid")
  (is (= (deck-in-size-range? {:cards {:a 8} :rules-card {:deck-limits {:size [4,8]}}}) true) "Deck with maximum size should be valid"))
  
