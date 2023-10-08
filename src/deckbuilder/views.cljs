(ns deckbuilder.views
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]))

(defn card-item [card]
  [:div.card-container
   [:div.card-name (:name card)]
   [:div.card-image]
   [:div.card-description (:description card)]])

(defn card-back [] [:div.card-container.card-back])

(defn draw-pile [draw-pile]
  (let [size (count draw-pile)]
    (cond
      (= size 0) [:div.empty-pile "draw"]
      (= size 1) [:div.draw-pile (card-back)]
      (= size 2) [:div.draw-pile (card-back) (card-back)]
      :else [:div.draw-pile (card-back) (card-back) (card-back)])))

(defn discard-pile [discard-pile]
  (let [size (count discard-pile)]
    (cond
      (= size 0) [:div.empty-pile "discard"]
      (= size 1) [:div.draw-pile (card-item (first discard-pile))]
      (= size 2) [:div.draw-pile (card-item (first discard-pile)) (card-item (second discard-pile))]
      :else [:div.draw-pile (card-item (first discard-pile)) (card-item (second discard-pile)) (card-item (second (rest discard-pile)))])))

(defn round-panel [round-data]
  [:div.round-panel [:div.pile-container
                     (draw-pile (:draw-pile round-data))
                     (card-item (:hand round-data))
                     (discard-pile (:discard-pile round-data))]
   [:button {:on-click #(re-frame/dispatch [:advance-game])} "Advance"]])

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
     [:h1.game-title "Deckbuilder"]
     [:div.main-content
      (round-panel @round-data)
      (resource-panel @resource-data)]]))