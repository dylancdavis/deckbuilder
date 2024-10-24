(ns deckbuilder.views.run
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.game.cards :as cards]
   [deckbuilder.views.cards :as card-views]))

(def MAX_DRAW_PILE_SIZE 3)

(def card-item card-views/card-item)

(defn card-back [] [:div.card-container.card-back {:key (js/Math.random)}])

(defn draw-pile [card-list]
  (let [pile-size (min (count card-list) MAX_DRAW_PILE_SIZE)]
    (if (zero? pile-size)
      [:div.empty-pile "draw"]
      [:div.draw-pile {:on-click #(re-frame/dispatch [:draw-cards 1])} (repeat pile-size (card-back))])))

(defn discard-pile [card-list]
  (let [pile-size (min (count card-list) MAX_DRAW_PILE_SIZE)]
    (if (zero? pile-size)
      [:div.empty-pile "discard"]
      (map card-item (take pile-size card-list)))))

(defn flippable-card [card]
  [:div.flip-card {:key (js/Math.random)}
   [:div.flip-card-inner
    [:div.flip-card-front (card-item card)]
    [:div.flip-card-back
     (card-back)]]])

(defn hand-display [hand]
  [:div.hand-group [:div.empty-pile (map flippable-card hand)]])

(defn resource-panel [resources]
  (let [points (:points resources)]
    [:div.resource-panel
     [:div {:class "resource"} (str (:display points) ": " (:value points))]]))

(defn overview-panel []
  (let [deck-info @(re-frame/subscribe [::subs/run-deck])
        rules-card (get deck-info :rules-card)]
    [:div.panel.overview-panel (card-item rules-card)]))

(defn advance-button [deck-data]
  (if (and (empty? (:draw-pile deck-data)) (empty? (:hand deck-data)))
    [:div.button-wrapper
     [:button.navigation {:on-click #(re-frame/dispatch [:end-run])} "End Run"]]
    [:div.button-wrapper
     [:button.advance
      {:on-click #(re-frame/dispatch [:advance-game])}
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

(defn hand-panel []
  (let [cards-data @(re-frame/subscribe [::subs/run-cards])
        resource-data @(re-frame/subscribe [::subs/resources])]
    [:div.panel.round-panel
     [:div.pile-container
      (hand-display (:hand cards-data))]
     (advance-button cards-data)
     (resource-panel resource-data)
     [:button.navigation {:on-click #(re-frame/dispatch [:end-run])} "Scrap Run"]]))

(defn deck-discard-panel []
  (let [cards-data @(re-frame/subscribe [::subs/run-cards])]
    [:div.panel.deck-discard-panel
     (draw-pile (:draw-pile cards-data))
     (discard-pile (:discard-pile cards-data))]))

(defn run-view []
  [:div.run-view
   (deck-discard-panel)
   (hand-panel)
   (overview-panel)])