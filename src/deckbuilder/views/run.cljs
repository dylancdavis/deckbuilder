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
      [:div.draw-pile (repeat pile-size (card-back))])))

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

(defn resource-item [resource]
  (print resource)
  [:div.resource {:class "resource"} (str "• " (:display resource) ": " (:value resource))])

(defn resource-panel [resources]
  [:div.resource-list
   [:h2 "Resources"]
   (map resource-item (vals resources))])

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

(defn rules-draw-panel [draw-cards rules-card]
  [:div.panel.rules-draw (card-item rules-card) (draw-pile draw-cards)])

(defn board-display [board-cards]
  [:div.hand-group [:div.empty-pile (map card-item board-cards)]])

(defn board-hand-panel [board-cards hand-cards resources]
  [:div.panel.board-hand-panel
   (board-display board-cards)
   (hand-display hand-cards)
   (resource-panel resources)])

(defn discard-stats-panel [discard-cards stats]
  [:div.panel.discard-stats-panel
   (discard-pile discard-cards)
   (map resource-item (vals stats))])

(defn run-panel [run]
  [:div.run-view
   (rules-draw-panel (get-in run [:cards :draw-pile]) (get-in run [:deck-info :rules-card]))
   (board-hand-panel (get-in run [:cards :board]) (get-in run [:cards :hand]) (get-in run [:resources]))
   (discard-stats-panel (get-in run [:cards :discard-pile]) (get-in run [:stats]))])

(defn run-view []
  (let [run @(re-frame/subscribe [::subs/run])]
    (run-panel run)))