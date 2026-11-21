package com.shopease.repository;

import com.shopease.entity.Order;
import com.shopease.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.product WHERE o.user.id = :userId")
    Page<Order> findByUserIdWithItems(@Param("userId") Long userId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.product WHERE o.id = :id")
    java.util.Optional<Order> findByIdWithItems(@Param("id") Long id);
}
