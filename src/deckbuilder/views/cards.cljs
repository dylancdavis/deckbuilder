(ns deckbuilder.views.cards (:require [deckbuilder.views.svg :as svg]))

(defn playable-card-content [card]
  [:<> [:div.card-image svg/lightning-svg]
   [:div.card-description (:description card)]])

(defn rules-card-content [card]
  [:div.rules-info
   [:div.card-description "Hello"]])

(defn card-item [card]
  [:div.card-container {:key (js/Math.random)}
   [:div.card-background
    [:div.card-name (:name card)]
    [:div.card-content
     (case (:type card)
       :rules (rules-card-content card)
       (playable-card-content card))]]])