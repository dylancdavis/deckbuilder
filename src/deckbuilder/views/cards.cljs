(ns deckbuilder.views.cards (:require [deckbuilder.views.svg :as svg]))

(defn playable-card-content [card]
  [:<> [:div.card-image svg/lightning-svg]
   [:div.card-description (:description card)]])

(defn rules-card-content [card]
  [:div.rules-info
   (let [deck-limits (:deck-limits card)
         [min-size max-size] (:size deck-limits)
         deck-text (if (= min-size max-size) (str min-size) (str min-size "-" max-size))]
     [:div.section.deck-limit
      [:div.deck-size [:span "Deck Size:"] [:span deck-text " Cards"]]])
   [:div.section.turn-structure
    [:div.turn-structure [:span "Turn:"] [:span "Draw 1, Play 1"]]]
   [:div.section.end-conditions
    [:div.end-conditions [:span "Game End:"] [:span "1 Round"]]]])

(defn card-item [card]
  [:div.card-container
   [:div.card-background
    [:div.card-name (:name card)]
    [:div.card-content
     (case (:type card)
       :rules (rules-card-content card)
       (playable-card-content card))]]])