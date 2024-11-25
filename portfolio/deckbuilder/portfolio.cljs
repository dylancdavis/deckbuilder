(ns deckbuilder.portfolio
  (:require [portfolio.ui :as ui]
            [portfolio.reagent :refer-macros [defscene]]
            [deckbuilder.views.cards :refer [card-item]]))

(ui/start!
 {:config {:css-paths ["/css/cards.css" "/css/index.css" "/css/reset.css"]}}
 )

(defscene my-first-scene [:h1 "Hello world!"])

(defscene test-card (card-item {:name "Example UI" :description "Some example card rendered as a UI component."}) )

(defn init [])