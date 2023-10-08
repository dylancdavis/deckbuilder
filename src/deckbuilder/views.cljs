(ns deckbuilder.views
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]))

(defn card-item [card]
  [:li (str (:name card) ": " (:description card))])

(defn card-pile [cards name]
  [:div.draw-pile [:h2 name]
   [:ul (map card-item cards)]])

(defn round-panel [round-data]
  (let [draw-pile (:draw-pile round-data)
        hand (:hand round-data)
        discard-pile (:discard-pile round-data)]
    [:div.round-panel [:div.pile-container
                       (card-pile draw-pile "Draw Pile")
                       (card-pile (if hand [hand] []) "Hand")
                       (card-pile discard-pile "Discard Pile")]
     [:button {:on-click #(re-frame/dispatch [:advance-game])} "Advance"]]))

(defn resource-panel [resources]
  (let [energy (:energy resources)
        credits (:credits resources)]
    [:div.resource-panel
     [:div {:class "resource"} (str (:display energy) ": " (:value energy))]
     [:div {:class "resource"} (str (:display credits) ": " (:value credits))]]))

(defn main-panel []
  (let [round-data (re-frame/subscribe [::subs/round])
        resource-data (re-frame/subscribe [::subs/resources])]
    [:div.main-panel
     [:h1 "Deckbuilder"]
     (round-panel @round-data)
     (resource-panel @resource-data)]))