(ns deckbuilder.events.collection
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.utilities.counter :refer [add sub]]
   [deckbuilder.utilities.utils :refer [first-missing-num]]))

(defn remove-modal-view [db] (update-in db [:view-data] #(dissoc % :modal-view)))

(re-frame/reg-event-db
 :clear-modal-view
 (fn [db _]
   (remove-modal-view db)))

(re-frame/reg-event-db
 :add-to-collection
 (fn [db [_ card]] (remove-modal-view (update-in db [:collection :cards] #(add % card)))))

(defn new-deck-name [deck-names]
  (let [new-deck-numbers (->> deck-names
                              (map #(re-find #"New Deck (\d+)" %))
                              (filter identity) ; Removes nil entries
                              (map #(js/parseInt (second %)))) ; extract deck numbers from names
        next-number (if (empty? new-deck-numbers) 1 (first-missing-num new-deck-numbers))]
    (str "New Deck " next-number)))

(re-frame/reg-event-db
 :add-new-deck
 (fn [db _]
   (update-in db [:collection :decklists]
              #(assoc % (random-uuid)
                      (let [decks (get-in db [:collection :decklists])
                            current-deck-names (map :name decks)] 
                        {:name (new-deck-name current-deck-names) :cards {}})))))

(re-frame/reg-event-db
 :add-card-to-selected-deck
 (fn [db [_ card]]
   (let [current-deck-key (get-in db [:ui :collection :selected-deck])]
     (update-in db
                [:game :collection :decklists current-deck-key :cards]
                #(add % card)))))

(re-frame/reg-event-db
 :remove-card-from-selected-deck
 (fn [db [_ card]]
   (let [current-deck-key (get-in db [:ui :collection :selected-deck])]
     (update-in db
                [:game :collection :decklists current-deck-key :cards]
                #(sub % card)))))

(re-frame/reg-event-db
 :set-selected-deck-rules-card
 (fn [db [_ rules-card]]
   (let [current-deck-key (get-in db [:ui :collection :selected-deck])]
     (assoc-in db [:game :collection :decklists current-deck-key :rules-card] rules-card))))

(re-frame/reg-event-db
 :clear-selected-deck-rules-card
 (fn [db [_ _rules-card]]
   (let [current-deck-key (get-in db [:ui :collection :selected-deck])]
     (assoc-in db [:game :collection :decklists current-deck-key :rules-card] nil))))