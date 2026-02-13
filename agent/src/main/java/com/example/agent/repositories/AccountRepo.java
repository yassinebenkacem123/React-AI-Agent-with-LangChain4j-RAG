package com.example.agent.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.agent.models.Account;

@Repository
public interface AccountRepo extends JpaRepository<Account, Long> {
    
}
