(ns deckbuilder.views.run
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.game.cards :as cards]
   [deckbuilder.views.cards :as card-views]))

(def card-item card-views/card-item)

(defn card-back [] [:div.card-container.card-back {:key (js/Math.random)}])

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
      (= size 1) [:div.discard-pile (card-item (first discard-pile))]
      (= size 2) [:div.discard-pile (card-item (first discard-pile)) (card-item (second discard-pile))]
      :else [:div.discard-pile (card-item (first discard-pile)) (card-item (second discard-pile)) (card-item (second (rest discard-pile)))])))

(defn flippable-card [card]
  [:div.flip-card {:key (js/Math.random)}
   [:div.flip-card-inner
    [:div.flip-card-front (card-item card)]
    [:div.flip-card-back
     (card-back)]]])

(defn hand-display [hand]
  [:div.hand-group [:div.empty-pile (if (nil? hand) nil (flippable-card hand))]])

(defn resource-panel [resources]
  (let [points (:points resources)]
    [:div.resource-panel
     [:div {:class "resource"} (str (:display points) ": " (:value points))]]))

(defn overview-panel []
  (let [deck-data @(re-frame/subscribe [::subs/round-deck])
        rules-card (get deck-data :rules-card)]
    [:div.panel.overview-panel (card-item rules-card)]))

(defn advance-button [deck-data modal-view]
  (if (and (empty? (:draw-pile deck-data)) (empty? (:hand deck-data)))
    [:div.button-wrapper
     [:button.navigation {:on-click #(re-frame/dispatch [:end-run])} "End Run"]]
    [:div.button-wrapper
     [:button.advance
      {:on-click #(re-frame/dispatch [:advance-game]) :disabled (not (nil? modal-view))}
      "Advance"]]))

(defn buy-modal [modal-view resource-data]
  (if (= modal-view :buy-basic)
    (let [first-card (rand-nth (vec cards/basic-cards))
          second-card (rand-nth (vec cards/basic-cards))
          points (:value (:points resource-data))
          afford-first? (>= points (:cost first-card))
          afford-second? (>= points (:cost second-card))]
      [:div.modal-view.buy-basic
       [:ul
        [:li (str "Card is: " (:name first-card) ". Costs: " (:cost first-card))
         [:button {:disabled (not afford-first?) :on-click (if afford-first? #(re-frame/dispatch [:add-to-collection first-card]) nil)} "Buy"]]
        [:li (str "Card is: " (:name second-card) ". Costs: " (:cost second-card))
         [:button {:disabled (not afford-second?) :on-click (if afford-second? #(re-frame/dispatch [:add-to-collection second-card]) nil)} "Buy"]]]
       [:button {:on-click #(re-frame/dispatch [:clear-modal-view])} "Continue"]])
    nil))

(defn round-panel []
  (let [deck-data @(re-frame/subscribe [::subs/round-deck])
        resource-data @(re-frame/subscribe [::subs/resources])
        modal-view @(re-frame/subscribe [::subs/modal-view])]
    [:div.panel.round-panel
     [:div.pile-container
      (hand-display (:hand deck-data))]
     (advance-button deck-data modal-view)
     (resource-panel resource-data)
     [:button.navigation {:on-click #(re-frame/dispatch [:end-run])} "Scrap Run"]]))

(defn deck-discard-panel []
  (let [deck-data @(re-frame/subscribe [::subs/round-deck])]
    [:div.panel.deck-discard-panel
     (draw-pile (:draw-pile deck-data))
     (discard-pile (:discard-pile deck-data))]))

(defn run-view []
  [:div.run-view
   (deck-discard-panel)
   (round-panel)
   (overview-panel)])