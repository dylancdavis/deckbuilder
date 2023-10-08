(ns deckbuilder.events
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.db :as db]
   ))

(re-frame/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/default-db))
