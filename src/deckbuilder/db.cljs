(ns deckbuilder.db
  (:require [deckbuilder.game.cards :as cards]))


(def default-db
  {:round cards/starting-round})
