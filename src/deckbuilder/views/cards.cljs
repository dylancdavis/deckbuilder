(ns deckbuilder.views.cards (:require [deckbuilder.views.svg :as svg]))

(defn playable-card-content [card]
  [:<> [:div.card-image svg/lightning-svg]
   [:div.card-description (:description card)]])

(defn rules-card-content [card]
  [:div.rules-info
   (let [deck-limits (:deck-limits card)]
     [:div.section.deck-limit
      [:div.deck-size [:span "Deck Size:"] [:span (:size deck-limits) " Cards"]]])
   [:div.section.run-structure
    [:div.turn-structure [:span "Turn:"] [:span "Draw 1, Play 1"]]]
   [:div.section.end-conditions
    [:div.end-conditions [:span "Game End:"] [:span "1 Round"]]]])

(defn card-item [card]
  [:div.card-container {:key (:name card) :data-tilt true}
   [:div.card-background
    [:div.card-name (:name card)]
    [:div.card-content
     (case (:type card)
       :rules (rules-card-content card)
       (playable-card-content card))]]])