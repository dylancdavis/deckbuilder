(ns deckbuilder.views.cards (:require [deckbuilder.views.svg :as svg]))

(defn card-item [card]
  [:div.card-container {:key (js/Math.random)}
   [:div.card-background
    [:div.card-name (:name card)]
    [:div.card-content
     [:div.card-image svg/lightning-svg]
     [:div.card-description (:description card)]]]])