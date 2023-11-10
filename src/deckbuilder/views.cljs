(ns deckbuilder.views
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.game.cards :as cards]))

(defn card-item [card]
  [:div.card-container {:key (js/Math.random)}
   [:div.card-background
    [:div.card-name (:name card)]
    [:div.card-description [:div.inner (:description card)]]]])

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
  [:div.hand-group [:div.empty-pile "hand"] (if (nil? hand) nil (flippable-card hand))])

(defn resource-panel [resources]
  (let [energy (:energy resources)
        credits (:credits resources)]
    [:div.resource-panel
     [:div {:class "resource"} (str (:display energy) ": " (:value energy))]
     [:div {:class "resource"} (str (:display credits) ": " (:value credits))]]))

(defn buy-card [card] (let
                       [resources @(re-frame/subscribe [::subs/resources])
                        credits (:credits resources)]
                        (if (>= credits (:cost card))
                          #(re-frame/dispatch [:add-to-collection card])
                          nil)))

(defn round-panel []
  (let [deck-data @(re-frame/subscribe [::subs/round-deck])
        resource-data @(re-frame/subscribe [::subs/resources])
        modal-view @(re-frame/subscribe [::subs/modal-view])]
    [:div.round-panel
     [:div.pile-container
      (draw-pile (:draw-pile deck-data))
      (hand-display (:hand deck-data))
      (discard-pile (:discard-pile deck-data))]
     (if (and (empty? (:draw-pile deck-data)) (empty? (:hand deck-data)))
       [:div.button-wrapper
        [:button.mavigation {:on-click #(re-frame/dispatch [:end-run])} "End Run"]]
       [:div.button-wrapper
        [:button.advance
         {:on-click #(re-frame/dispatch [:advance-game]) :disabled (not (nil? modal-view))}
         "Advance"]])
     (resource-panel resource-data)
     (if (= modal-view :buy-basic)
       (let [first-card (rand-nth (vec cards/basic-cards))
             second-card (rand-nth (vec cards/basic-cards))]
         [:div.modal-view.buy-basic
          [:ul
           [:li (str "Card is: " (:name first-card) ". Costs: " (:cost first-card))
            [:button {:on-click #(re-frame/dispatch [:add-to-collection first-card])} "Buy"]]
           [:li (str "Card is: " (:name second-card) ". Costs: " (:cost second-card))
            [:button {:on-click #(re-frame/dispatch [:add-to-collection second-card])} "Buy"]]]
          [:button {:on-click #(re-frame/dispatch [:clear-modal-view])} "Continue"]])
       nil)]))

(defn collection-card-item [[card amount]] [:div.card-collection-item {:key (:name card)}
                                            (card-item card)
                                            [:div.amount (str amount)]])

(defn selected-deck-view []
  (let
   [selected-deck @(re-frame/subscribe [::subs/selected-deck])
    collection @(re-frame/subscribe [::subs/collection])]
    (if
     (nil? selected-deck)
      (map (fn [decklist] (let [name (:name decklist)]
                            [:div.decklist-item
                             {:key name :on-click #(re-frame/dispatch [:select-deck decklist])}
                             "Deck Item: " name]))
           (:decklists collection))
      [:h2
       [:span {:on-click #(re-frame/dispatch [:select-deck nil])} "<--"]
       "Selected Deck: " (:name selected-deck)
       [:ul (map (fn [[card amount]]
                   [:li {:key (:name card)} " -" (:name card) " x" amount]) (:cards selected-deck))]
       [:div {:on-click #(re-frame/dispatch [:start-run selected-deck])} "Run This Deck"]])))


(defn collection-view []
  (let
   [collection (re-frame/subscribe [::subs/collection])]
    [:div.collection-view

     [:div.decklist-panel
      [:div.panel-header "Decks"]
      (selected-deck-view)]

     [:div.cards-panel
      [:div.panel-header "Cards"]
      [:div.card-grid
       (map collection-card-item (:cards @collection))]]]))

(defn get-view [name] (name {:collection collection-view :round round-panel}))

(defn main-panel []
  (let [view (re-frame/subscribe [::subs/view])]
    [:div.main-panel
     [:h1.game-title "Deckbuilder"]
     [:div.main-content
      ((get-view @view))]]))