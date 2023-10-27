(ns deckbuilder.views
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.game.cards :as cards]))

(defn card-item [card]
  [:div.card-container {:key (js/Math.random)}
   [:div.card-name (:name card)]
   [:div.card-image]
   [:div.card-description (:description card)]])

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
  [:div.flip-card {:key (:key card)}
   [:div.flip-card-inner
    [:div.flip-card-front (card-item card)]
    [:div.flip-card-back
     (card-back)]]])

(defn hand-display [hand]
  [:div.hand-group [:div.empty-pile "hand"] (if (nil? hand) nil (flippable-card hand))])

(defn round-panel [round-data]
  [:div.round-panel [:div.pile-container
                     (draw-pile (:draw-pile round-data))
                     (hand-display (:hand round-data))
                     (discard-pile (:discard-pile round-data))]
   [:div.button-wrapper
    [:button.advance {:on-click #(re-frame/dispatch [:advance-game])} "Advance"]]])

(defn resource-panel [resources]
  (let [energy (:energy resources)
        credits (:credits resources)]
    [:div.resource-panel
     [:div {:class "resource"} (str (:display energy) ": " (:value energy))]
     [:div {:class "resource"} (str (:display credits) ": " (:value credits))]]))

(defn collection-card-item [[card amount]] [:div.card-collection-item {:key (:name card)}
                                            (card-item card)
                                            [:div.amount (str amount)]])

(collection-card-item [cards/energy 2])

(defn selected-deck-view []
  (let
   [selected-deck (re-frame/subscribe [::subs/selected-deck])
    collection (re-frame/subscribe [::subs/collection])]
    (if
     (nil? @selected-deck)
      (map (fn [decklist] (let [name (:name decklist)]
                            [:div.decklist-item {:key name :on-click #(re-frame/dispatch [:select-deck name])} name]))
           (:decklists @collection))
      (:h2 "Selected deck:" @selected-deck))))

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