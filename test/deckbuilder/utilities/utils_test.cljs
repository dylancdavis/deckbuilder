(ns deckbuilder.utilities.utils-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.utilities.utils :refer [first-missing-num]]))

(deftest first-missing-num-test
  (is (= (first-missing-num []) 1) "Empty list should return 1")
  (is (= (first-missing-num [1 2 3]) 4) "No missing numbers should return next number")
  (is (= (first-missing-num [1 3 4]) 2) "Missing number should return that number")
  (is (= (first-missing-num [1 2 3 5 7]) 4) "Multiple missing numbers should return first one")
  (is (= (first-missing-num [2 3 5]) 1)) "If 1 is missing, it should be returned")