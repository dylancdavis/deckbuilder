(ns deckbuilder.game.run)

(defn add-points [game] (update game :points inc))

(defn generate-credits [game]
  (if (>= (:points game) 2)
    (update (update game :points dec) :credits inc)
    game))