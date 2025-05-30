(ns deckbuilder.utilities.utils-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.utilities.utils :refer [first-missing-num select-keys-by move-items]]))

(deftest first-missing-num-test
  (is (= (first-missing-num []) 1) "Should return 1 when given empty list")
  (is (= (first-missing-num [1 2 3]) 4) "Should return next number for a standard sequence")
  (is (= (first-missing-num [1 3 4]) 2) "Should return a skipped number in the middle of the sequence")
  (is (= (first-missing-num [1 2 3 5 7]) 4) "Should return the first misssing number when multiple are missing")
  (is (= (first-missing-num [2 3 5]) 1)) "Should return 1 if it's missing from the sequence")

(deftest select-keys-by-test
  (is (= (select-keys-by {} odd?) {}) "Should return an empty map in base case")
  (is (= (select-keys-by {:a 1 :b 3 :c 5} even?) {}) "Should return empty map when no values match")
  (is (= (select-keys-by {:a 1 :b 3 :c 5} odd?) {:a 1 :b 3 :c 5}) "Should return the same map when all values match")
  (is (= (select-keys-by {:a 1 :b 2 :c 3} odd?) {:a 1 :c 3}) "Should filter to only keys according to predicate"))

(deftest move-items-test
  (is (= (move-items [1 2 3 4] [5 6 7 8] 2) [[3 4] [5 6 7 8 1 2]]) "Should move 2 items from first to second")
  (is (= (move-items [1 2 3 4] [5 6 7 8] 4) [[] [5 6 7 8 1 2 3 4]]) "Should move all items from first to second")
  (is (= (move-items [1 2 3 4] [5 6 7 8] 0) [[1 2 3 4] [5 6 7 8]]) "Should move 0 items from first to second")
  (is (= (move-items [1 2 3 4] [] 4) [[] [1 2 3 4]]) "Should move items into an empty vector"))