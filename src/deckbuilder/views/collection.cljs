(ns deckbuilder.views.collection
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.views.cards :as card-views]))

(def card-item card-views/card-item)

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
      [:div.decks-container (map (fn [[deck-key decklist]] (let [name (:name decklist)]
                                                             [:div.decklist-item
                                                              {:key name :on-click #(re-frame/dispatch [:select-deck deck-key])}
                                                              name]))
                                 (:decklists collection))
       [:button {:on-click #(re-frame/dispatch [:add-new-deck]) :class "add-new-deck"} "Add New Deck"]]
      [:div {:class "selected-deck-view"}
       [:h2 [:span {:on-click #(re-frame/dispatch [:select-deck nil]) :class "back-to-decks"} "←"] (:name selected-deck)]
       [:div.card-list-container
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
                      [:button {:on-click #(re-frame/dispatch [:remove-card-from-selected-deck card])} "X"]]) (:cards selected-deck))]]]

       [:button {:class "run-deck" :on-click (if (= current-deck-size required-deck-size) #(re-frame/dispatch [:start-run selected-deck]) nil)} "Run This Deck"]])))


(defn rules-card-item [card rules-card-selected? amount-in-collection]
  [:div.card-collection-item
   {:key (:name card)
    :on-click (if rules-card-selected? nil #(re-frame/dispatch [:set-selected-deck-rules-card card]))
    :class (if rules-card-selected? "disabled" "clickable")}
   (card-item card)
   [:div.card-interaction-row [:div.amount (str "x " amount-in-collection)] [:div.add-card "+"]]
   (if rules-card-selected? [:div.overlay-text "Rules Card Already Selected"] nil)])

(defn playable-card-item [card amount-in-decklist amount-in-collection]
  [:div.card-collection-item
   (let
    [reached-card-limit? (< amount-in-decklist amount-in-collection)]
     {:key (:name card)
      :on-click (if reached-card-limit? nil #(re-frame/dispatch [:add-card-to-selected-deck card]))
      :class (if reached-card-limit? "disabled" "clickable")})
   (card-item card)
   [:div.card-interaction-row [:div.amount (str "x " amount-in-collection)] [:div.add-card "+"]]
   (if (>= amount-in-decklist amount-in-collection) "Reached max" nil)])

(defn collection-card-item [[card amount-in-collection] selected-deck]
  (let [selected-cards (:cards selected-deck)
        amount-in-decklist (get selected-cards card)
        card-type (:type card)
        rules-card-selected? (not (nil? (:rules-card selected-deck)))]
    (if (= card-type :rules)
      (rules-card-item card rules-card-selected? amount-in-collection)
      (playable-card-item card amount-in-decklist amount-in-collection))))

(defn collection-view []
  (let
   [collection @(re-frame/subscribe [::subs/collection])]
    [:div.collection-view

     [:div.decklist-panel
      [:div.panel-header "Decks"]
      (selected-deck-view)]

     (let [selected-deck @(re-frame/subscribe [::subs/selected-deck])]
       [:div.cards-panel
        [:div.panel-header "Cards"]
        [:div.card-grid
         (if (= (:cards collection) {}) "No Cards in Collection. Run the starter deck!" (map #(collection-card-item % selected-deck) (:cards collection)))]])]))
