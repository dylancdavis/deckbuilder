(ns deckbuilder.events.collection
  (:require
   [re-frame.core :as re-frame]))

(defn remove-modal-view [db] (update-in db [:view-data] #(dissoc % :modal-view)))

(re-frame/reg-event-db
 :clear-modal-view
 (fn [db _]
   (remove-modal-view db)))

(defn inc-in-map [map key] (if (nil? (get map key)) (assoc map key 1) (update-in map [key] inc)))

(defn dec-in-map [map key]
  (cond
    (nil? (get map key)) map
    (= 1 (get map key)) (dissoc map key)
    :else (update-in map [key] dec)))

(re-frame/reg-event-db
 :add-to-collection
 (fn [db [_ card]] (remove-modal-view (update-in db [:collection :cards] #(inc-in-map % card)))))

(re-frame/reg-event-db
 :add-new-deck
 (fn [db _] (update-in db [:collection :decklists] #(assoc % (random-uuid) {:name (js/prompt "Deck Name") :cards {}}))))

(re-frame/reg-event-db
 :add-card-to-selected-deck
 (fn [db [_ card]]
   (let [current-deck-key (get-in db [:ui :collection :selected-deck])]
     (update-in db
                [:game :collection :decklists current-deck-key :cards]
                #(inc-in-map % card)))))

(re-frame/reg-event-db
 :remove-card-from-selected-deck
 (fn [db [_ card]]
   (let [current-deck-key (get-in db [:ui :collection :selected-deck])]
     (update-in db
                [:game :collection :decklists current-deck-key :cards]
                #(dec-in-map % card)))))

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