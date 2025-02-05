(ns deckbuilder.constants
  (:require [deckbuilder.game.cards :as cards]))

(def starting-deck-list {:name "Starter Deck" :cards {} :rules-card cards/starter-rules :editable false})