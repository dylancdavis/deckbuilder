(ns deckbuilder.events.collection
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.utilities.counter :refer [add sub]]
   [deckbuilder.utilities.collection :refer [new-deck-name]]))

(defn remove-modal-view [db] (update-in db [:view-data] #(dissoc % :modal-view)))

(re-frame/reg-event-db
 :clear-modal-view
 (fn [db _]
   (remove-modal-view db)))

(re-frame/reg-event-db
 :add-to-collection
 (fn [db [_ card]] (remove-modal-view (update-in db [:collection :cards] #(add % card)))))

(re-frame/reg-event-db
 :add-new-deck
 (fn [db _]
   (update-in db [:game :collection :decklists]
              #(assoc %
                      (random-uuid)
                      (let [deck-map (get-in db [:game :collection :decklists])
                            current-deck-names (map :name (vals deck-map))]
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