(ns deckbuilder.events
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.db :as db]
   [deckbuilder.game.round :as round]))

(re-frame/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/default-db))

(re-frame/reg-event-db
 :advance-game
 (fn [db _]
   (update db :round round/advance-deck)))

(re-frame/reg-event-db
 :add-energy
 (fn [db _]
   (update-in db [:resources :energy :value] inc)))

(re-frame/reg-event-db
 :generate-credit
 (fn [db _]
   (if
    (>= (get-in db [:resources :energy :value]) 3)
     (-> db (update-in [:resources :energy :value] #(- % 3))
         (update-in [:resources :credits :value] inc)) db)))

(re-frame/reg-event-db
 :select-deck
 (fn [db [deck-name]]
   (assoc-in db [:view-data :selected-deck] deck-name)))

