(ns deckbuilder.views.collection
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.views.cards :as card-views]
   [deckbuilder.game.deck :refer [check-deck-validity]]))

(def card-item card-views/card-item)

(defn deck-size [decklist] (reduce + (vals (:cards decklist))))

(defn selected-rules-card-display [rules-card]
  [:div.card-list-block
   (if (nil? rules-card)
     [:div.card-list-header "No Rules Card Selected"]
     [:<>
      [:div.card-list-header "Rules Card:"]
      [:ul [:li.deck-card-count-item [:span (get rules-card :name)] [:button {:on-click #(re-frame/dispatch [:clear-selected-deck-rules-card])} "X"]]]])])

(defn deck-size-text [current-deck-size required-deck-size]
  [:div.card-list-header
   (if (zero? required-deck-size)
     "No Cards Allowed"
     [:<>
      "Cards in Deck: "
      [:span.deck-card-amount
       (if
        (not (nil? required-deck-size))
         [:span "(" current-deck-size "/" required-deck-size ")"]
         current-deck-size)]])])

(defn selected-deck-cards-display [current-deck-size required-deck-size selected-deck]
  [:div.card-list-block
   (deck-size-text current-deck-size required-deck-size)
   (let [deck-selected-cards (:cards selected-deck)
         has-cards-selected? (seq deck-selected-cards)]
     (if has-cards-selected?
       [:ul (map (fn [[card amount]]
                   [:li.deck-card-count-item {:key (:name card)}
                    [:span (:name card) " x" amount]
                    [:button {:on-click #(re-frame/dispatch [:remove-card-from-selected-deck card])} "X"]]) (:cards selected-deck))]
       nil))])

(defn deck-list-entry [[deck-key decklist]]
  (let [name (:name decklist)]
    [:div.decklist-item
     {:key name :on-click #(re-frame/dispatch [:select-deck deck-key])}
     name]))

(defn deck-list-view [collection]
  [:div.decks-container
   (map deck-list-entry (:decklists collection))
   [:button.add-new-deck {:on-click #(re-frame/dispatch [:add-new-deck])} "Add New Deck"]])

(defn deck-edit-view [selected-deck current-deck-size required-deck-size is-deck-valid?]
  [:div.selected-deck-view
   [:h2 [:span.back-to-decks {:on-click #(re-frame/dispatch [:select-deck nil])} "←"] (:name selected-deck)]
   [:div.card-list-container
    (selected-rules-card-display (get-in selected-deck [:rules-card]))
    (selected-deck-cards-display current-deck-size required-deck-size selected-deck)
    [:button.run-deck {:class (if is-deck-valid? "clickable" "disabled")
                       :on-click (if is-deck-valid? #(re-frame/dispatch [:start-run selected-deck]) nil)} "Run This Deck"]]])

(defn selected-deck-view []
  (let
   [selected-deck-key @(re-frame/subscribe [::subs/selected-deck-key])
    selected-deck @(re-frame/subscribe [::subs/selected-deck])
    collection @(re-frame/subscribe [::subs/collection])
    current-deck-size (deck-size selected-deck)
    required-deck-size (get-in selected-deck [:rules-card :deck-limits :size])
    is-deck-valid? (check-deck-validity selected-deck collection)]
    (if
     (nil? selected-deck-key)
      (deck-list-view collection)
      (deck-edit-view selected-deck current-deck-size required-deck-size is-deck-valid?))))


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

(defn playable-card-item [card amount-in-decklist amount-in-collection editing-deck? selected-deck]
  (let
   [no-cards-allowed? (zero? (get-in selected-deck [:rules-card :deck-limits :size]))
    reached-collection-limit? (>= amount-in-decklist amount-in-collection)
    reached-deck-limit? (and (:deck-limit card) (>= amount-in-decklist (:deck-limit card)))
    disable-adding? (or no-cards-allowed? reached-collection-limit? reached-deck-limit?)]
    [:div.card-collection-item
     {:key (:name card)
      :on-click (if editing-deck?
                  (if disable-adding? nil #(re-frame/dispatch [:add-card-to-selected-deck card]))
                  nil)
      :class (if editing-deck?
               (if disable-adding? "disabled" "clickable")
               nil)}
     (card-item card)
     [:div.card-interaction-row [:div.amount (str "x " amount-in-collection)] (if editing-deck? [:div.add-card "+"] nil)]
     (if disable-adding? [:div.overlay-text "None Left"] nil)]))

(defn collection-card-item [[card amount-in-collection] selected-deck]
  (let [selected-cards (:cards selected-deck)
        amount-in-decklist (get selected-cards card)
        card-type (:type card)
        editing-deck? (not (nil? selected-deck))
        rules-card-selected? (not (nil? (:rules-card selected-deck)))]
    (if (= card-type :rules)
      (rules-card-item card rules-card-selected? amount-in-collection editing-deck?)
      (playable-card-item card amount-in-decklist amount-in-collection editing-deck? selected-deck))))

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
