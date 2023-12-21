(ns deckbuilder.views
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.game.cards :as cards]))

(def lightning-svg
  [:svg
   {:xmlns "http://www.w3.org/2000/svg"
    :xmlSpace "preserve"
    :width 50
    :height 70
    :view-box "-1 -1.4 127 177.8"}
   [:path
    {:strokeLinecap "round"
     :d "M32.903-86.129h-69.677L-61.29 4.194h49.032L-27.74 86.129 61.29-20.323H9.032z"
     :style {:stroke "#000",
             :strokeWidth 2,
             :strokeDasharray "none",
             :strokeLinecap "butt",
             :strokeDashoffset 0,
             :strokeLinejoin "miter",
             :strokeMiterlimit 4,
             :fill "#fff",
             :fillRule "nonzero",
             :opacity 1}
     :transform "matrix(1.01974 0 0 1.01592 62.5 87.5)"}]])

(defn card-item [card]
  [:div.card-container {:key (js/Math.random)}
   [:div.card-background
    [:div.card-name (:name card)]
    [:div.card-content
     [:div.card-image lightning-svg]
     [:div.card-description [:div.card-label "Basic"] (:description card)]]]])

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
        [:button.navigation {:on-click #(re-frame/dispatch [:end-run])} "End Run"]]
       [:div.button-wrapper
        [:button.advance
         {:on-click #(re-frame/dispatch [:advance-game]) :disabled (not (nil? modal-view))}
         "Advance"]])
     (resource-panel resource-data)
     (if (= modal-view :buy-basic)
       (let [first-card (rand-nth (vec cards/basic-cards))
             second-card (rand-nth (vec cards/basic-cards))
             credits (:value (:credits resource-data))
             afford-first? (>= credits (:cost first-card))
             afford-second? (>= credits (:cost second-card))]
         [:div.modal-view.buy-basic
          [:ul
           [:li (str "Card is: " (:name first-card) ". Costs: " (:cost first-card))
            [:button {:disabled (not afford-first?) :on-click (if afford-first? #(re-frame/dispatch [:add-to-collection first-card]) nil)} "Buy"]]
           [:li (str "Card is: " (:name second-card) ". Costs: " (:cost second-card))
            [:button {:disabled (not afford-second?) :on-click (if afford-second? #(re-frame/dispatch [:add-to-collection second-card]) nil)} "Buy"]]]
          [:button {:on-click #(re-frame/dispatch [:clear-modal-view])} "Continue"]])
       nil)
     [:button.navigation {:on-click #(re-frame/dispatch [:end-run])} "Scrap Run"]]))

(defn collection-card-item [[card amount-in-collection]]
  (let [selected-deck @(re-frame/subscribe [::subs/selected-deck])
        selected-cards (:cards selected-deck)
        amount-in-decklist (get selected-cards card)
        card-type (:type card)]
    (if (= card-type :rules)
      [:div.card-collection-item
       {:key (:name card) :on-click (if (nil? (:rules-card selected-deck)) #(re-frame/dispatch [:set-selected-deck-rules-card card]) nil)}
       (card-item card)
       [:div.amount (str amount-in-collection)]
       (if (nil? (:rules-card selected-deck)) nil "Rules Card Already Selected")]
      [:div.card-collection-item
       {:key (:name card) :on-click (if (< amount-in-decklist amount-in-collection) #(re-frame/dispatch [:add-card-to-selected-deck card]) nil)}
       (card-item card)
       [:div.amount (str amount-in-collection)]
       (if (>= amount-in-decklist amount-in-collection) "Reached max" nil)])))

(defn deck-size [decklist] (reduce + (vals (:cards decklist))))

(defn selected-deck-view []
  (let
   [selected-deck-key @(re-frame/subscribe [::subs/selected-deck-key])
    selected-deck @(re-frame/subscribe [::subs/selected-deck])
    collection @(re-frame/subscribe [::subs/collection])
    current-deck-size (deck-size selected-deck)
    required-deck-size (get-in selected-deck [:rules-card :deck-size])]
    (if
     (nil? selected-deck-key)
      [:div (map (fn [[deck-key decklist]] (let [name (:name decklist)]
                                             [:div.decklist-item
                                              {:key name :on-click #(re-frame/dispatch [:select-deck deck-key])}
                                              "Deck Item: " name]))
                 (:decklists collection))
       [:button {:on-click #(re-frame/dispatch [:add-new-deck]) :class "add-new-deck"} "Add New Deck"]]
      [:div {:class "selected-deck-view"}
       [:h2 [:span {:on-click #(re-frame/dispatch [:select-deck nil]) :class "back-to-decks"} "<--"] "Selected Deck: " (:name selected-deck)]
       [:div {:class "card-list-block"}
        [:div {:class "card-list-header"} "Rules Card:"]
        (let [current-rules-card (get-in selected-deck [:rules-card])]
          (if (nil? current-rules-card)
            "None"
            [:ul [:li {:class "deck-card-count-item"} [:span (get current-rules-card :name)] [:button {:on-click #(re-frame/dispatch [:clear-selected-deck-rules-card])} "X"]]]))]
       [:div {:class "card-list-block"}
        [:div {:class "card-list-header"} "Cards in Deck: (" current-deck-size "/" required-deck-size ")"]
        [:ul (map (fn [[card amount]]
                    [:li {:key (:name card) :class "deck-card-count-item"}
                     [:span (:name card) " x" amount]
                     [:button {:on-click #(re-frame/dispatch [:remove-card-from-selected-deck card])} "X"]]) (:cards selected-deck))]]

       [:button {:class "run-deck" :on-click (if (= current-deck-size required-deck-size) #(re-frame/dispatch [:start-run selected-deck]) nil)} "Run This Deck"]])))


(defn collection-view []
  (let
   [collection @(re-frame/subscribe [::subs/collection])]
    [:div.collection-view

     [:div.decklist-panel
      [:div.panel-header "Decks"]
      (selected-deck-view)]

     [:div.cards-panel
      [:div.panel-header "Cards"]
      [:div.card-grid
       (if (= (:cards collection) {}) "No Cards in Collection. Run the starter deck!" (map collection-card-item (:cards collection)))]]]))

(defn get-view [name] (name {:collection collection-view :round round-panel}))

(defn main-panel []
  (let [view @(re-frame/subscribe [::subs/view])]
    [:div.main-panel
     [:h1.game-title "Deckbuilder"]
     [:div.main-content
      ((get-view view))]]))