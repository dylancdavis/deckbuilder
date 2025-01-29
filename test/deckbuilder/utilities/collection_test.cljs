(ns deckbuilder.utilities.collection-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.utilities.collection :refer [new-deck-name]]))

(deftest new-deck-name-test
  (is (= (new-deck-name []) "New Deck 1") "New deck from empty list isn't named \"New Deck 1\"")
    (is (= (new-deck-name ["New Deck 1"]) "New Deck 2") "Deck name isn't incremented")
    (is (= (new-deck-name ["New Deck 1" "New Deck 3"]) "New Deck 2") "Missing deck number isn't reused")
    (is (= (new-deck-name ["NewDeck1"]) "New Deck 1") "Deck name isn't \"New Deck 1\" with non-new name in list"))