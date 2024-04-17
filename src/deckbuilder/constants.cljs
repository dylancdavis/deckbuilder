(ns deckbuilder.constants
  (:require [deckbuilder.game.cards :as cards]))

(def starting-deck-list {:name "Starter Deck" :cards {} :rules-card cards/basic-rules})

(def starting-round-resources {:points 0})

(def displays {:resources {:points "Points"}})