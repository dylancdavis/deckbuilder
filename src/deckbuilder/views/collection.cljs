(ns deckbuilder.views.collection
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.views.cards :as card-views]))

(def card-item card-views/card-item)

(defn deck-size [decklist] (reduce + (vals (:cards decklist))))

(defn selected-rules-card-display [rules-card]
  [:div.card-list-block
   (if (nil? rules-card)
     [:div.card-list.block "No Rules Card Selected"]
     [:<>
      [:div.card-list-header "Rules Card:"]
      [:ul [:li.deck-card-count-item [:span (get rules-card :name)] [:button {:on-click #(re-frame/dispatch [:clear-selected-deck-rules-card])} "X"]]]])])

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
        (selected-rules-card-display (get-in selected-deck [:rules-card]))
        [:div {:class "card-list-block"}
         [:div {:class "card-list-header"} "Cards in Deck: (" current-deck-size "/" required-deck-size ")"]
         [:ul (map (fn [[card amount]]
                     [:li {:key (:name card) :class "deck-card-count-item"}
                      [:span (:name card) " x" amount]
                      [:button {:on-click #(re-frame/dispatch [:remove-card-from-selected-deck card])} "X"]]) (:cards selected-deck))]]]

       [:button {:class "run-deck" :on-click (if (= current-deck-size required-deck-size) #(re-frame/dispatch [:start-run selected-deck]) nil)} "Run This Deck"]])))


(defn rules-card-item [card rules-card-selected? amount-in-collection editing-deck?]
  [:div.card-collection-item
   {:key (:name card)
    :on-click (if editing-deck?
                (if rules-card-selected? nil #(re-frame/dispatch [:set-selected-deck-rules-card card]))
                nil)
    :class (if editing-deck?
             (if rules-card-selected? "disabled" "clickable")
             nil)}
   (card-item card)
   [:div.card-interaction-row [:div.amount (str "x " amount-in-collection)] (if editing-deck? [:div.add-card "+"] nil)]
   (if rules-card-selected? [:div.overlay-text "Rules Card Already Selected"] nil)])

(defn playable-card-item [card amount-in-decklist amount-in-collection editing-deck?]
  (let
   [reached-card-limit? (>= amount-in-decklist amount-in-collection)]
    [:div.card-collection-item
     {:key (:name card)
      :on-click (if editing-deck?
                  (if reached-card-limit? nil #(re-frame/dispatch [:add-card-to-selected-deck card]))
                  nil)
      :class (if editing-deck?
               (if reached-card-limit? "disabled" "clickable")
               nil)}
     (card-item card)
     [:div.card-interaction-row [:div.amount (str "x " amount-in-collection)] (if editing-deck? [:div.add-card "+"] nil)]
     (if reached-card-limit? [:div.overlay-text "None Left"] nil)]))

(defn collection-card-item [[card amount-in-collection] selected-deck]
  (let [selected-cards (:cards selected-deck)
        amount-in-decklist (get selected-cards card)
        card-type (:type card)
        editing-deck? (not (nil? selected-deck))
        rules-card-selected? (not (nil? (:rules-card selected-deck)))]
    (if (= card-type :rules)
      (rules-card-item card rules-card-selected? amount-in-collection editing-deck?)
      (playable-card-item card amount-in-decklist amount-in-collection editing-deck?))))

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
