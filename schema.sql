-- =====================================================================
-- BANKING MANAGEMENT SYSTEM DATABASE SCHEMA (PostgreSQL)
-- =====================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(20),
    address VARCHAR(255),
    phone_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create User Accounts Table
CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_no VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    balance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    acct_type VARCHAR(20) NOT NULL, -- 'SAVINGS', 'CURRENT'
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'CLOSED', 'FROZEN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create Account Transactions Table
CREATE TABLE IF NOT EXISTS account_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_no VARCHAR(100) NOT NULL UNIQUE,
    from_account_id BIGINT,
    to_account_id BIGINT,
    transaction_type VARCHAR(30) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'
    amount DOUBLE PRECISION NOT NULL,
    remaining_balance DOUBLE PRECISION,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_txn_from_account FOREIGN KEY (from_account_id) REFERENCES user_accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_txn_to_account FOREIGN KEY (to_account_id) REFERENCES user_accounts(id) ON DELETE SET NULL
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_account_no ON user_accounts(account_no);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_acct ON account_transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_acct ON account_transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON account_transactions(created_at DESC);