(ns deckbuilder.db
  (:require [deckbuilder.constants :as constants]))

(def default-db
  {:view :collection
   :collection {:cards {} :card-backs {} :decklists {:starting-deck constants/starting-deck-list}}
   :view-data {:selected-deck nil}})